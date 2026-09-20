<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\RawMaterial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = PurchaseOrder::with('supplier');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->integer('supplier_id'));
        }

        if ($request->filled('search')) {
            $query->where('po_no', 'like', '%'.$request->string('search').'%');
        }

        return $query->latest()->paginate($request->integer('per_page', 15));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'order_date' => ['required', 'date'],
            'expected_date' => ['nullable', 'date'],
            'status' => ['nullable', 'in:draft,ordered,partially_received,received,cancelled'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.raw_material_id' => ['required', 'exists:raw_materials,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        $subtotal = 0;
        foreach ($data['items'] as $item) {
            $subtotal += $item['quantity'] * $item['unit_price'];
        }

        $purchaseOrder = DB::transaction(function () use ($data, $subtotal, $request) {
            $purchaseOrder = PurchaseOrder::create([
                'supplier_id' => $data['supplier_id'],
                'order_date' => $data['order_date'],
                'expected_date' => $data['expected_date'] ?? null,
                'status' => $data['status'] ?? 'draft',
                'notes' => $data['notes'] ?? null,
                'subtotal' => round($subtotal, 2),
                'tax' => 0,
                'total' => round($subtotal, 2),
                'created_by' => $request->user()->id,
            ]);

            $purchaseOrder->update(['po_no' => sprintf('PO-%05d', $purchaseOrder->id)]);

            foreach ($data['items'] as $item) {
                $purchaseOrder->items()->create([
                    'raw_material_id' => $item['raw_material_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total' => round($item['quantity'] * $item['unit_price'], 2),
                ]);
            }

            return $purchaseOrder;
        });

        return response()->json($purchaseOrder->load(['supplier', 'items.rawMaterial']), 201);
    }

    public function show(PurchaseOrder $purchaseOrder)
    {
        return $purchaseOrder->load(['supplier', 'items.rawMaterial']);
    }

    public function update(Request $request, PurchaseOrder $purchaseOrder)
    {
        $data = $request->validate([
            'supplier_id' => ['sometimes', 'exists:suppliers,id'],
            'order_date' => ['sometimes', 'date'],
            'expected_date' => ['nullable', 'date'],
            'status' => ['nullable', 'in:draft,ordered,partially_received,received,cancelled'],
            'notes' => ['nullable', 'string'],
        ]);

        $purchaseOrder->update($data);

        return $purchaseOrder->load(['supplier', 'items.rawMaterial']);
    }

    public function receive(Request $request, PurchaseOrder $purchaseOrder)
    {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.purchase_order_item_id' => ['required', 'exists:purchase_order_items,id'],
            'items.*.received_quantity' => ['required', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($data, $purchaseOrder) {
            foreach ($data['items'] as $entry) {
                $item = $purchaseOrder->items()->findOrFail($entry['purchase_order_item_id']);
                $delta = $entry['received_quantity'] - $item->received_quantity;
                $item->update(['received_quantity' => $entry['received_quantity']]);

                if ($delta !== 0.0) {
                    RawMaterial::where('id', $item->raw_material_id)
                        ->increment('current_stock', $delta);
                }
            }

            $items = $purchaseOrder->items()->get();
            $allReceived = $items->every(fn ($item) => $item->received_quantity >= $item->quantity);
            $anyReceived = $items->contains(fn ($item) => $item->received_quantity > 0);

            $purchaseOrder->update([
                'status' => $allReceived ? 'received' : ($anyReceived ? 'partially_received' : $purchaseOrder->status),
            ]);
        });

        return $purchaseOrder->load(['supplier', 'items.rawMaterial']);
    }

    public function destroy(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->delete();

        return response()->json(null, 204);
    }
}
