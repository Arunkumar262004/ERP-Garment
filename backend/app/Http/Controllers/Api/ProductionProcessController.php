<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductionOrder;
use App\Models\ProductionProcess;
use Illuminate\Http\Request;

class ProductionProcessController extends Controller
{
    public function index(Request $request)
    {
        $query = ProductionProcess::with(['productionOrder.contact', 'assignee']);

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
            'process_type' => ['required', 'in:cutting,stitching,printing,washing,packing,quality_check,other'],
            'sequence' => ['nullable', 'integer', 'min:1'],
            'assigned_to' => ['nullable', 'exists:users,id'],
        ]);

        $data['sequence'] = $data['sequence'] ?? ($productionOrder->processes()->max('sequence') + 1);
        $process = $productionOrder->processes()->create($data);

        return response()->json($process->load('assignee'), 201);
    }

    public function update(Request $request, ProductionProcess $productionProcess)
    {
        $data = $request->validate([
            'status' => ['nullable', 'in:pending,in_progress,completed,skipped'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'quantity_completed' => ['nullable', 'numeric', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'remarks' => ['nullable', 'string'],
        ]);

        if (($data['status'] ?? null) === 'in_progress' && ! $productionProcess->start_date) {
            $data['start_date'] = now()->toDateString();
        }

        if (($data['status'] ?? null) === 'completed' && ! $productionProcess->end_date) {
            $data['end_date'] = now()->toDateString();
        }

        $productionProcess->update($data);

        $order = $productionProcess->productionOrder;
        $statuses = $order->processes()->pluck('status');

        if ($statuses->every(fn ($s) => $s === 'completed' || $s === 'skipped')) {
            $order->update(['status' => 'completed']);
        } elseif ($statuses->contains('in_progress') || $statuses->contains('completed')) {
            $order->update(['status' => 'in_production']);
        }

        return $productionProcess->load('assignee');
    }

    public function destroy(ProductionProcess $productionProcess)
    {
        $productionProcess->delete();

        return response()->json(null, 204);
    }
}
