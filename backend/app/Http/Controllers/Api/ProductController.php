<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::withCount('variants')->with(['brand', 'variants' => function ($q) {
            $q->select('id', 'product_id', 'size_id', 'color', 'sku', 'stock_quantity', 'price')->with('size');
        }]);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhereHas('brand', fn ($b) => $b->where('name', 'like', "%{$search}%"))
                    ->orWhere('garment_type', 'like', "%{$search}%");
            });
        }

        return $query->latest()->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'brand_id' => ['nullable', 'exists:brands,id'],
            'garment_type' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:100'],
            'hsn_code' => ['nullable', 'string', 'max:20'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'in:active,inactive'],
        ]);

        $product = Product::create($data);

        return response()->json($product->load('brand'), 201);
    }

    public function show(Product $product)
    {
        return $product->load(['brand', 'variants.size', 'variants.sourceItem']);
    }

    public function update(Request $request, Product $product)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'brand_id' => ['nullable', 'exists:brands,id'],
            'garment_type' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:100'],
            'hsn_code' => ['nullable', 'string', 'max:20'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'in:active,inactive'],
        ]);

        $product->update($data);

        return $product->load('brand');
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return response()->json(null, 204);
    }

    public function addVariant(Request $request, Product $product)
    {
        $data = $request->validate([
            'size_id' => ['nullable', 'exists:sizes,id'],
            'color' => ['nullable', 'string', 'max:50'],
            'sku' => ['required', 'string', 'max:100', 'unique:product_variants,sku'],
            'stock_quantity' => ['nullable', 'numeric', 'min:0'],
            'price' => ['required', 'numeric', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
        ]);

        $variant = $product->variants()->create($data);

        return response()->json($variant->load('size'), 201);
    }
}
