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
    public function update(Request $request, ProductionOrder $productionOrder, ProductionOrderItem $item)
    {
        abort_unless($item->production_order_id === $productionOrder->id, 404);

        $data = $request->validate([
            'sku' => ['nullable', 'string', 'max:100', 'unique:production_order_items,sku,'.$item->id],
            'garment_type' => ['nullable', 'string', 'max:100'],
            'gsm' => ['nullable', 'integer', 'min:0'],
            'cutting_weight_kg' => ['nullable', 'numeric', 'min:0'],
            'size_id' => ['nullable', 'exists:sizes,id'],
            'color' => ['nullable', 'string', 'max:50'],
            'hsn_code' => ['nullable', 'string', 'max:20'],
            'details' => ['nullable', 'string'],
        ]);

        if (empty($data['sku']) && empty($item->sku)) {
            $data['sku'] = sprintf('%s-%03d', $productionOrder->order_no, $item->id);
        }

        $item->update($data);

        return $item;
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
