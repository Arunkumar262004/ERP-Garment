<?php

namespace App\Http\Controllers\Api;

use App\Events\ProductionOrderCompleted;
use App\Http\Controllers\Controller;
use App\Mail\ProcessAssignedMail;
use App\Mail\SalesUpdateMail;
use App\Models\ProductionOrder;
use App\Models\ProductionProcess;
use App\Models\User;
use App\Notifications\ProcessStageChangedNotification;
use App\Services\MailService;
use App\Services\WasenderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProductionProcessController extends Controller
{
    public function __construct(protected WasenderService $wasender, protected MailService $mail) {}

    public function stageCounts()
    {
        $rows = ProductionProcess::select('process_type', 'status', DB::raw('count(*) as total'))
            ->groupBy('process_type', 'status')
            ->get();

        $result = collect(ProductionProcess::PROCESS_TYPES)->map(function ($type) use ($rows) {
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
            'process_type' => ['required', 'in:'.implode(',', ProductionProcess::PROCESS_TYPES)],
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
        $oldEmployeeId = $productionProcess->assigned_employee_id;
        $oldAssignedTo = $productionProcess->assigned_to;

        if (array_key_exists('due_date', $data) && $data['due_date'] !== $productionProcess->due_date?->toDateString()) {
            $data['due_reminder_sent_at'] = null;
        }

        $productionProcess->update($data);

        $productionProcess->productionOrder->refreshStatusFromProcesses();
        $this->notifyStageChange($productionProcess, $oldStatus);
        $this->notifyEmployeeAssignment($productionProcess, $oldEmployeeId);
        $this->notifyAdminOfAssignment($productionProcess, $oldAssignedTo, $oldEmployeeId);

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
     * Notify the shop-floor employee (mail + WhatsApp) when they're newly
     * assigned to a process — a different audience from notifyStageChange()
     * above, which notifies the system-user `assigned_to` about status moves.
     * Silently does nothing if the employee didn't change or was cleared.
     */
    protected function notifyEmployeeAssignment(ProductionProcess $process, ?int $oldEmployeeId): void
    {
        if (! $process->assigned_employee_id || $process->assigned_employee_id === $oldEmployeeId) {
            return;
        }

        $process = $process->fresh(['productionOrder.contact', 'employee']);
        $employee = $process->employee;

        if (! $employee) {
            return;
        }

        if ($employee->email) {
            $this->mail->send($employee->email, new ProcessAssignedMail($process));
        }

        if ($employee->phone) {
            $stageLabel = ProductionOrder::STAGE_LABELS[$process->process_type] ?? $process->process_type;
            $order = $process->productionOrder;

            $this->wasender->sendText(
                $employee->phone,
                "Hi {$employee->name}, you've been assigned to the {$stageLabel} stage on order {$order->order_no} for {$order->contact?->name}."
            );
        }
    }

    /**
     * Keep the admin in the loop on every assignment — whoever actually made
     * the change (admin or any other staff member), the admin gets a short
     * email confirming who a stage was just handed to. Covers both audiences
     * a process can be assigned to: a system user (`assigned_to`) and a
     * shop-floor employee (`assigned_employee_id`). Silently does nothing
     * when neither actually changed, or no admin address is configured.
     */
    protected function notifyAdminOfAssignment(ProductionProcess $process, ?int $oldAssignedTo, ?int $oldEmployeeId): void
    {
        $adminEmail = config('services.admin_notifications.email');

        if (! $adminEmail) {
            return;
        }

        $assignedToChanged = $process->assigned_to && $process->assigned_to !== $oldAssignedTo;
        $employeeChanged = $process->assigned_employee_id && $process->assigned_employee_id !== $oldEmployeeId;

        if (! $assignedToChanged && ! $employeeChanged) {
            return;
        }

        $process = $process->fresh(['productionOrder.contact', 'assignee', 'employee']);
        $order = $process->productionOrder;
        $stageLabel = ProductionOrder::STAGE_LABELS[$process->process_type] ?? $process->process_type;
        $assignees = array_filter([$process->assignee?->name, $process->employee?->name]);

        if (! $assignees) {
            return;
        }

        $this->mail->send($adminEmail, new SalesUpdateMail(
            "{$stageLabel} on {$order->order_no} assigned",
            "{$stageLabel} on order {$order->order_no} ({$order->contact?->name}) was assigned to ".implode(' / ', $assignees).'.'
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

            $wasCompleted = $order->status === 'completed';
            $order->update(['status' => 'completed']);

            if (! $wasCompleted) {
                event(new ProductionOrderCompleted($order));
            }

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
            'target_process_type' => ['required', 'in:'.implode(',', ProductionProcess::PROCESS_TYPES)],
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

        // Completed orders/stages are locked — reject the whole batch up front
        // (no partial writes) so the frontend can show the error and stay put
        // instead of navigating into a stage it then has to bounce back out of.
        $blocked = [];
        foreach ($entries as $entry) {
            $order = $entry['order'];
            $process = $entry['process'];

            if ($order->status === 'completed') {
                $blocked[] = "{$order->order_no} is already completed and locked.";

                continue;
            }

            if ($process && $process->status === 'completed') {
                $blocked[] = "{$order->order_no} — this stage is already completed and locked.";

                continue;
            }

            $existingTarget = $order->processes()->where('process_type', $data['target_process_type'])->first();

            if ($existingTarget && $existingTarget->status === 'completed') {
                $blocked[] = "{$order->order_no} — the ".str_replace('_', ' ', $data['target_process_type']).' stage is already completed and locked.';
            }
        }

        if (! empty($blocked)) {
            return response()->json(['message' => implode(' ', $blocked)], 422);
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

                $order->refreshStatusFromProcesses();

                $targets[] = ['production_order_id' => $order->id, 'production_process_id' => $target->id];
            }
        });

        return response()->json(['moved' => $entries->count(), 'targets' => $targets]);
    }

    public function destroy(ProductionProcess $productionProcess)
    {
        $productionProcess->delete();

        return response()->json(null, 204);
    }
}
