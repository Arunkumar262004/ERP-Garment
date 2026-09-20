<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductionOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductionOrderController extends Controller
{
    protected const DEFAULT_PROCESSES = ['cutting', 'stitching', 'printing', 'washing', 'packing'];

    public function index(Request $request)
    {
        $query = ProductionOrder::with('contact');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('contact_id')) {
            $query->where('contact_id', $request->integer('contact_id'));
        }

        if ($request->filled('search')) {
            $query->where('order_no', 'like', '%'.$request->string('search').'%');
        }

        return $query->latest()->paginate($request->integer('per_page', 15));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'contact_id' => ['required', 'exists:contacts,id'],
            'quotation_id' => ['nullable', 'exists:quotations,id'],
            'invoice_id' => ['nullable', 'exists:invoices,id'],
            'order_date' => ['required', 'date'],
            'expected_delivery_date' => ['nullable', 'date'],
            'status' => ['nullable', 'in:pending,in_production,completed,delivered,cancelled'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_name' => ['required', 'string', 'max:255'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit' => ['nullable', 'string', 'max:30'],
            'processes' => ['nullable', 'array'],
            'processes.*' => ['string', 'in:cutting,stitching,printing,washing,packing,quality_check,other'],
        ]);

        $totalQuantity = array_sum(array_column($data['items'], 'quantity'));
        $processTypes = $data['processes'] ?? self::DEFAULT_PROCESSES;

        $order = DB::transaction(function () use ($data, $totalQuantity, $processTypes, $request) {
            $order = ProductionOrder::create([
                'contact_id' => $data['contact_id'],
                'quotation_id' => $data['quotation_id'] ?? null,
                'invoice_id' => $data['invoice_id'] ?? null,
                'order_date' => $data['order_date'],
                'expected_delivery_date' => $data['expected_delivery_date'] ?? null,
                'status' => $data['status'] ?? 'pending',
                'total_quantity' => round($totalQuantity, 2),
                'notes' => $data['notes'] ?? null,
                'created_by' => $request->user()->id,
            ]);

            $order->update(['order_no' => sprintf('PRD-%05d', $order->id)]);

            foreach ($data['items'] as $item) {
                $order->items()->create($item);
            }

            foreach (array_values($processTypes) as $index => $processType) {
                $order->processes()->create([
                    'process_type' => $processType,
                    'sequence' => $index + 1,
                    'status' => 'pending',
                ]);
            }

            return $order;
        });

        return response()->json($order->load(['contact', 'items', 'processes']), 201);
    }

    public function show(ProductionOrder $productionOrder)
    {
        return $productionOrder->load(['contact', 'items', 'processes.assignee', 'quotation', 'invoice', 'deliveries']);
    }

    public function update(Request $request, ProductionOrder $productionOrder)
    {
        $data = $request->validate([
            'contact_id' => ['sometimes', 'exists:contacts,id'],
            'quotation_id' => ['nullable', 'exists:quotations,id'],
            'invoice_id' => ['nullable', 'exists:invoices,id'],
            'order_date' => ['sometimes', 'date'],
            'expected_delivery_date' => ['nullable', 'date'],
            'status' => ['nullable', 'in:pending,in_production,completed,delivered,cancelled'],
            'notes' => ['nullable', 'string'],
        ]);

        $productionOrder->update($data);

        return $productionOrder->load(['contact', 'items', 'processes']);
    }

    public function destroy(ProductionOrder $productionOrder)
    {
        $productionOrder->delete();

        return response()->json(null, 204);
    }
}
