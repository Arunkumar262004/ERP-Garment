<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductionOrder;
use App\Models\ProductionProcess;
use App\Models\User;
use App\Notifications\ProcessStageChangedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProductionProcessController extends Controller
{
    protected const PROCESS_TYPE_LIST = ['dyeing', 'printing', 'cutting', 'stitching', 'packing', 'quality_check', 'other'];

    protected const PROCESS_TYPES = 'cutting,dyeing,stitching,printing,packing,quality_check,other';

    public function stageCounts()
    {
        $rows = ProductionProcess::select('process_type', 'status', DB::raw('count(*) as total'))
            ->groupBy('process_type', 'status')
            ->get();

        $result = collect(self::PROCESS_TYPE_LIST)->map(function ($type) use ($rows) {
            $forType = $rows->where('process_type', $type);

            return [
                'process_type' => $type,
                'pending' => (int) (optional($forType->firstWhere('status', 'pending'))->total ?? 0),
                'in_progress' => (int) (optional($forType->firstWhere('status', 'in_progress'))->total ?? 0),
                'completed' => (int) (optional($forType->firstWhere('status', 'completed'))->total ?? 0),
                'skipped' => (int) (optional($forType->firstWhere('status', 'skipped'))->total ?? 0),
                'total' => (int) $forType->sum('total'),
            ];
        })->values();

        return response()->json($result);
    }

    public function index(Request $request)
    {
        $query = ProductionProcess::with(['productionOrder.contact', 'productionOrder.items.size', 'assignee']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('process_type')) {
            $query->where('process_type', $request->string('process_type'));
        }

        if ($request->filled('production_order_id')) {
            $query->where('production_order_id', $request->integer('production_order_id'));
        }

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->integer('assigned_to'));
        }

        return $query->orderBy('sequence')->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request, ProductionOrder $productionOrder)
    {
        $data = $request->validate([
            'process_type' => ['required', 'in:'.self::PROCESS_TYPES],
            'sequence' => ['nullable', 'integer', 'min:1'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'due_date' => ['nullable', 'date'],
        ]);

        $data['sequence'] = $data['sequence'] ?? ($productionOrder->processes()->max('sequence') + 1);
        $process = $productionOrder->processes()->create($data);
        $this->importAllCurrentItems($process);

        return response()->json($process->load(['assignee', 'items']), 201);
    }

    /**
     * Snapshot every order item currently on the order into a process's
     * checklist. Called when the process is first created so the item(s) that
     * existed at that point never need a manual import.
     */
    protected function importAllCurrentItems(ProductionProcess $process): void
    {
        $itemIds = $process->productionOrder->items()->pluck('id');

        if ($itemIds->isEmpty()) {
            return;
        }

        $process->items()->syncWithoutDetaching(
            $itemIds->mapWithKeys(fn ($id) => [$id => ['imported_at' => now()]])
        );
    }

    /**
     * Pull in any order items added after this process was created (or after
     * the last import) — items the process's checklist has never seen.
     */
    public function importMissedItems(ProductionProcess $productionProcess)
    {
        $existingIds = $productionProcess->items()->pluck('production_order_items.id');
        $missedIds = $productionProcess->productionOrder->items()
            ->whereNotIn('id', $existingIds)
            ->pluck('id');

        if ($missedIds->isEmpty()) {
            return response()->json(['imported' => []]);
        }

        $productionProcess->items()->syncWithoutDetaching(
            $missedIds->mapWithKeys(fn ($id) => [$id => ['imported_at' => now()]])
        );

        return response()->json(['imported' => $missedIds->values()]);
    }

    public function update(Request $request, ProductionProcess $productionProcess)
    {
        $data = $request->validate([
            'status' => ['nullable', 'in:pending,in_progress,completed,skipped'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'assigned_employee_id' => ['nullable', 'exists:contacts,id'],
            'quantity_completed' => ['nullable', 'numeric', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date'],
            'remarks' => ['nullable', 'string'],
        ]);

        if (($data['status'] ?? null) === 'in_progress' && ! $productionProcess->start_date) {
            $data['start_date'] = now()->toDateString();
        }

        if (($data['status'] ?? null) === 'completed' && ! $productionProcess->end_date) {
            $data['end_date'] = now()->toDateString();
        }

        $oldStatus = $productionProcess->status;

        $productionProcess->update($data);

        $this->refreshOrderStatus($productionProcess->productionOrder);
        $this->notifyStageChange($productionProcess, $oldStatus);

        return $productionProcess->load(['assignee', 'employee']);
    }

    /**
     * Notify the assigned system user (mail + in-app) when a process's status
     * changes — the "move one stage to another" moment the business flow
     * cares about. Silently does nothing if nobody is assigned or the status
     * didn't actually change, so routine field edits (remarks, dates) stay
     * quiet.
     */
    protected function notifyStageChange(ProductionProcess $process, string $oldStatus): void
    {
        if ($process->status === $oldStatus || ! $process->assigned_to) {
            return;
        }

        $user = $process->assignee ?? User::find($process->assigned_to);

        $user?->notify(new ProcessStageChangedNotification(
            $process->fresh(['productionOrder.contact']),
            $oldStatus,
            $process->status
        ));
    }

    /**
     * Quick action: complete a Quality Check process and hand the order off to Delivery.
     */
    public function markDelivered(Request $request, ProductionProcess $productionProcess)
    {
        if ($productionProcess->process_type !== 'quality_check') {
            throw ValidationException::withMessages([
                'process' => ['Only a Quality Check process can be marked delivered.'],
            ]);
        }

        $delivery = DB::transaction(function () use ($productionProcess, $request) {
            if ($productionProcess->status !== 'completed') {
                $productionProcess->update([
                    'status' => 'completed',
                    'start_date' => $productionProcess->start_date ?? now()->toDateString(),
                    'end_date' => now()->toDateString(),
                ]);
            }

            $order = $productionProcess->productionOrder;

            $delivery = $order->deliveries()->first();

            if (! $delivery) {
                $delivery = $order->deliveries()->create([
                    'contact_id' => $order->contact_id,
                    'delivery_address' => $order->contact->billing_address ?? $order->contact->shipping_address ?? null,
                    'status' => 'pending',
                    'created_by' => $request->user()->id,
                ]);
                $delivery->update(['delivery_no' => sprintf('DLV-%05d', $delivery->id)]);
            }

            $order->update(['status' => 'completed']);

            return $delivery;
        });

        return response()->json(['delivery' => $delivery->load('contact', 'productionOrder')]);
    }

    /**
     * Bulk action: move a batch of selected processes to an arbitrary target stage,
     * regardless of pipeline sequence. Completes each selected process and starts
     * (or creates, if the order's pipeline doesn't already include it) the target stage.
     */
    public function bulkMove(Request $request)
    {
        $data = $request->validate([
            'process_ids' => ['required_without:production_order_ids', 'array', 'min:1'],
            'process_ids.*' => ['integer', 'exists:production_processes,id'],
            'production_order_ids' => ['required_without:process_ids', 'array', 'min:1'],
            'production_order_ids.*' => ['integer', 'exists:production_orders,id'],
            'target_process_type' => ['required', 'in:'.self::PROCESS_TYPES],
        ]);

        if (! empty($data['production_order_ids'])) {
            // A brand-new order may have no processes yet — there's nothing to "complete"
            // in that case, we just create/activate the target stage directly.
            $entries = ProductionOrder::whereIn('id', $data['production_order_ids'])->get()
                ->map(fn (ProductionOrder $order) => [
                    'order' => $order,
                    'process' => $order->processes()
                        ->whereNotIn('status', ['completed', 'skipped'])
                        ->orderBy('sequence')
                        ->first(),
                ]);
        } else {
            $entries = ProductionProcess::with('productionOrder')->whereIn('id', $data['process_ids'])->get()
                ->map(fn (ProductionProcess $process) => ['order' => $process->productionOrder, 'process' => $process]);
        }

        $targets = [];

        DB::transaction(function () use ($entries, $data, &$targets) {
            foreach ($entries as $entry) {
                $order = $entry['order'];
                $process = $entry['process'];

                if ($process && ! in_array($process->status, ['completed', 'skipped'], true)) {
                    $process->update([
                        'status' => 'completed',
                        'start_date' => $process->start_date ?? now()->toDateString(),
                        'end_date' => now()->toDateString(),
                    ]);
                }

                $target = $order->processes()->where('process_type', $data['target_process_type'])->first();

                if (! $target) {
                    $target = $order->processes()->create([
                        'process_type' => $data['target_process_type'],
                        'sequence' => (int) $order->processes()->max('sequence') + 1,
                        'status' => 'pending',
                    ]);
                    $this->importAllCurrentItems($target);
                }

                if ((! $process || $target->id !== $process->id) && $target->status === 'pending') {
                    $target->update(['status' => 'in_progress', 'start_date' => $target->start_date ?? now()->toDateString()]);
                }

                $this->refreshOrderStatus($order);

                $targets[] = ['production_order_id' => $order->id, 'production_process_id' => $target->id];
            }
        });

        return response()->json(['moved' => $entries->count(), 'targets' => $targets]);
    }

    protected function refreshOrderStatus(ProductionOrder $order): void
    {
        $statuses = $order->processes()->pluck('status');

        if ($statuses->every(fn ($s) => $s === 'completed' || $s === 'skipped')) {
            $order->update(['status' => 'completed']);
        } elseif ($statuses->contains('in_progress') || $statuses->contains('completed')) {
            $order->update(['status' => 'in_production']);
        }
    }

    public function destroy(ProductionProcess $productionProcess)
    {
        $productionProcess->delete();

        return response()->json(null, 204);
    }
}
