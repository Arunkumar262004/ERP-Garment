<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\Request;

class BrandController extends Controller
{
    public function index(Request $request)
    {
        $query = Brand::query();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->string('search').'%');
        }

        return $query->orderBy('name')->paginate($request->integer('per_page', 50));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:brands,name'],
            'status' => ['nullable', 'in:active,inactive'],
        ]);

        return response()->json(Brand::create($data), 201);
    }

    public function update(Request $request, Brand $brand)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:100', 'unique:brands,name,'.$brand->id],
            'status' => ['nullable', 'in:active,inactive'],
        ]);

        $brand->update($data);

        return $brand;
    }

    public function destroy(Brand $brand)
    {
        $brand->delete();

        return response()->json(null, 204);
    }
}
