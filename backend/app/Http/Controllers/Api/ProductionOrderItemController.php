<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductionOrder;
use App\Models\ProductionOrderItem;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProductionOrderItemController extends Controller
{
    protected function itemRules(ProductionOrderItem $item = null): array
    {
        $skuUnique = 'unique:production_order_items,sku'.($item ? ','.$item->id : '');

        return [
            'item_name' => [$item ? 'sometimes' : 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'quantity' => [$item ? 'sometimes' : 'required', 'numeric', 'min:0.01'],
            'unit' => ['nullable', 'string', 'max:30'],
            'sku' => ['nullable', 'string', 'max:100', $skuUnique],
            'garment_type' => ['nullable', 'string', 'max:100'],
            'gsm' => ['nullable', 'integer', 'min:0'],
            'cutting_weight_kg' => ['nullable', 'numeric', 'min:0'],
            'size_id' => ['nullable', 'exists:sizes,id'],
            'color' => ['nullable', 'string', 'max:50'],
            'hsn_code' => ['nullable', 'string', 'max:20'],
            'details' => ['nullable', 'string'],
        ];
    }

    protected function refreshOrderQuantity(ProductionOrder $productionOrder): void
    {
        $productionOrder->update(['total_quantity' => $productionOrder->items()->sum('quantity')]);
    }

    /**
     * Add a new line item directly to an existing order — used by the process
     * edit page's items table so staff can add items without leaving that
     * screen. Optionally imports the new item straight into the process it
     * was added from, so it doesn't show up as "missed".
     */
    public function store(Request $request, ProductionOrder $productionOrder)
    {
        $data = $request->validate(array_merge($this->itemRules(), [
            'production_process_id' => ['nullable', 'exists:production_processes,id'],
        ]));

        $processId = $data['production_process_id'] ?? null;
        unset($data['production_process_id']);

        $item = DB::transaction(function () use ($productionOrder, $data, $processId) {
            $item = $productionOrder->items()->create($data);
            $this->refreshOrderQuantity($productionOrder);

            if ($processId) {
                $process = $productionOrder->processes()->find($processId);
                $process?->items()->syncWithoutDetaching([$item->id => ['imported_at' => now()]]);
            }

            return $item;
        });

        return response()->json($item->load('size'), 201);
    }

    public function update(Request $request, ProductionOrder $productionOrder, ProductionOrderItem $item)
    {
        abort_unless($item->production_order_id === $productionOrder->id, 404);

        $data = $request->validate($this->itemRules($item));

        if (empty($data['sku']) && empty($item->sku)) {
            $data['sku'] = sprintf('%s-%03d', $productionOrder->order_no, $item->id);
        }

        $item->update($data);

        if (array_key_exists('quantity', $data)) {
            $this->refreshOrderQuantity($productionOrder);
        }

        return $item->load('size');
    }

    public function destroy(ProductionOrder $productionOrder, ProductionOrderItem $item)
    {
        abort_unless($item->production_order_id === $productionOrder->id, 404);

        $item->delete();
        $this->refreshOrderQuantity($productionOrder);

        return response()->json(null, 204);
    }

    /**
     * Push a packed item's quantity into the retail Inventory: finds or creates the
     * matching Product Variant (by product + size + color) and adds this item's
     * quantity to its stock. Safe to call again later (e.g. a second packing batch)
     * — it accumulates stock rather than overwriting it.
     */
    public function pushToInventory(Request $request, ProductionOrder $productionOrder, ProductionOrderItem $item)
    {
        abort_unless($item->production_order_id === $productionOrder->id, 404);

        if ($productionOrder->order_type !== 'own') {
            throw ValidationException::withMessages([
                'order_type' => ['This order is marked "Others" (made for a client) — it cannot be added to your own retail inventory.'],
            ]);
        }

        $data = $request->validate([
            'product_id' => ['required_without:new_product', 'nullable', 'exists:products,id'],
            'new_product.name' => ['required_without:product_id', 'string', 'max:255'],
            'new_product.brand_id' => ['nullable', 'exists:brands,id'],
            'new_product.category' => ['nullable', 'string', 'max:100'],
            'price' => ['required', 'numeric', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'quantity' => ['nullable', 'numeric', 'min:0.01'],
        ]);

        $variant = DB::transaction(function () use ($data, $item, $productionOrder) {
            if (! empty($data['product_id'])) {
                $product = Product::findOrFail($data['product_id']);
            } else {
                $product = Product::create([
                    'name' => $data['new_product']['name'],
                    'brand_id' => $data['new_product']['brand_id'] ?? $productionOrder->brand_id,
                    'garment_type' => $item->garment_type,
                    'category' => $data['new_product']['category'] ?? null,
                    'hsn_code' => $item->hsn_code,
                    'status' => 'active',
                ]);
            }

            $quantity = $data['quantity'] ?? (float) $item->quantity;

            $variant = ProductVariant::where('product_id', $product->id)
                ->where('size_id', $item->size_id)
                ->where('color', $item->color)
                ->lockForUpdate()
                ->first();

            if ($variant) {
                $variant->increment('stock_quantity', $quantity);
                $variant->update([
                    'price' => $data['price'],
                    'cost_price' => $data['cost_price'] ?? $variant->cost_price,
                    'production_order_item_id' => $item->id,
                ]);
            } else {
                $variant = ProductVariant::create([
                    'product_id' => $product->id,
                    'size_id' => $item->size_id,
                    'color' => $item->color,
                    'sku' => $item->sku ?: strtoupper(Str::slug($product->name.'-'.$item->id, '-')),
                    'stock_quantity' => $quantity,
                    'price' => $data['price'],
                    'cost_price' => $data['cost_price'] ?? null,
                    'production_order_item_id' => $item->id,
                ]);
            }

            return $variant;
        });

        return response()->json($variant->load('product', 'size'), 201);
    }
}
