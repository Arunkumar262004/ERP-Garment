<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductionOrder;
use App\Models\RawMaterial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductionOrderController extends Controller
{
    protected const PROCESS_TYPES = 'cutting,dyeing,stitching,printing,packing,quality_check,other';

    public function index(Request $request)
    {
        $query = ProductionOrder::with(['contact', 'brand', 'processes']);

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
            'brand_id' => ['nullable', 'exists:brands,id'],
            'order_type' => ['nullable', 'in:own,others'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_name' => ['required', 'string', 'max:255'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit' => ['nullable', 'string', 'max:30'],
            'materials' => ['nullable', 'array'],
            'materials.*.raw_material_id' => ['required', 'exists:raw_materials,id'],
            'materials.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'processes' => ['nullable', 'array'],
            'processes.*' => ['string', 'in:'.self::PROCESS_TYPES],
        ]);

        $totalQuantity = array_sum(array_column($data['items'], 'quantity'));
        $processTypes = $data['processes'] ?? [];
        $materials = $data['materials'] ?? [];

        $order = DB::transaction(function () use ($data, $totalQuantity, $processTypes, $materials, $request) {
            $order = ProductionOrder::create([
                'contact_id' => $data['contact_id'],
                'quotation_id' => $data['quotation_id'] ?? null,
                'invoice_id' => $data['invoice_id'] ?? null,
                'order_date' => $data['order_date'],
                'expected_delivery_date' => $data['expected_delivery_date'] ?? null,
                'status' => $data['status'] ?? 'pending',
                'total_quantity' => round($totalQuantity, 2),
                'brand_id' => $data['brand_id'] ?? null,
                'order_type' => $data['order_type'] ?? 'own',
                'notes' => $data['notes'] ?? null,
                'created_by' => $request->user()->id,
            ]);

            $order->update(['order_no' => sprintf('PRD-%05d', $order->id)]);

            foreach ($data['items'] as $item) {
                $order->items()->create($item);
            }

            $itemIds = $order->items()->pluck('id');

            foreach (array_values($processTypes) as $index => $processType) {
                $process = $order->processes()->create([
                    'process_type' => $processType,
                    'sequence' => $index + 1,
                    'status' => 'pending',
                ]);

                // Snapshot every item that exists on the order at creation time —
                // only items added later count as "missed" for this process.
                if ($itemIds->isNotEmpty()) {
                    $process->items()->syncWithoutDetaching(
                        $itemIds->mapWithKeys(fn ($id) => [$id => ['imported_at' => now()]])
                    );
                }
            }

            foreach ($materials as $material) {
                $rawMaterial = RawMaterial::lockForUpdate()->findOrFail($material['raw_material_id']);

                $order->materials()->create([
                    'raw_material_id' => $rawMaterial->id,
                    'quantity' => $material['quantity'],
                    'unit' => $rawMaterial->unit,
                ]);

                $rawMaterial->decrement('current_stock', $material['quantity']);
            }

            return $order;
        });

        return response()->json($order->load(['contact', 'brand', 'items.size', 'processes', 'materials.rawMaterial']), 201);
    }

    public function show(ProductionOrder $productionOrder)
    {
        return $productionOrder->load([
            'contact', 'brand', 'items.size', 'items.variant', 'processes.assignee', 'processes.employee', 'processes.items',
            'quotation', 'invoice', 'deliveries', 'materials.rawMaterial',
        ]);
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
            'brand_id' => ['nullable', 'exists:brands,id'],
            'order_type' => ['nullable', 'in:own,others'],
            'notes' => ['nullable', 'string'],
            'items' => ['sometimes', 'array', 'min:1'],
            'items.*.id' => ['nullable', 'integer', 'exists:production_order_items,id'],
            'items.*.item_name' => ['required_with:items', 'string', 'max:255'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.quantity' => ['required_with:items', 'numeric', 'min:0.01'],
            'items.*.unit' => ['nullable', 'string', 'max:30'],
        ]);

        DB::transaction(function () use ($data, $productionOrder) {
            if (isset($data['items'])) {
                $keepIds = [];

                foreach ($data['items'] as $item) {
                    $fields = [
                        'item_name' => $item['item_name'],
                        'description' => $item['description'] ?? null,
                        'quantity' => $item['quantity'],
                        'unit' => $item['unit'] ?? null,
                    ];

                    // Preserve sku/garment_type/gsm/details recorded separately via Cutting Output.
                    $existing = ! empty($item['id']) ? $productionOrder->items()->find($item['id']) : null;

                    $record = $existing ? tap($existing)->update($fields) : $productionOrder->items()->create($fields);

                    $keepIds[] = $record->id;
                }

                $productionOrder->items()->whereNotIn('id', $keepIds)->delete();

                $data['total_quantity'] = round(array_sum(array_column($data['items'], 'quantity')), 2);
                unset($data['items']);
            }

            $productionOrder->update($data);
        });

        return $productionOrder->load(['contact', 'brand', 'items.size', 'processes', 'materials.rawMaterial']);
    }

    public function destroy(ProductionOrder $productionOrder)
    {
        $productionOrder->delete();

        return response()->json(null, 204);
    }
}
