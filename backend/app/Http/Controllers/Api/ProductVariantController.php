<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductVariant;
use Illuminate\Http\Request;

class ProductVariantController extends Controller
{
    public function update(Request $request, ProductVariant $productVariant)
    {
        $data = $request->validate([
            'size_id' => ['nullable', 'exists:sizes,id'],
            'color' => ['nullable', 'string', 'max:50'],
            'sku' => ['sometimes', 'string', 'max:100', 'unique:product_variants,sku,'.$productVariant->id],
            'stock_quantity' => ['nullable', 'numeric', 'min:0'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
        ]);

        $productVariant->update($data);

        return $productVariant->load('size');
    }

    public function destroy(ProductVariant $productVariant)
    {
        $productVariant->delete();

        return response()->json(null, 204);
    }
}
