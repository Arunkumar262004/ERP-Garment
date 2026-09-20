<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Size;
use Illuminate\Http\Request;

class SizeController extends Controller
{
    public function index(Request $request)
    {
        $query = Size::query();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->string('search').'%');
        }

        return $query->orderBy('sort_order')->orderBy('name')->paginate($request->integer('per_page', 50));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:50', 'unique:sizes,name'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', 'in:active,inactive'],
        ]);

        return response()->json(Size::create($data), 201);
    }

    public function update(Request $request, Size $size)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:50', 'unique:sizes,name,'.$size->id],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', 'in:active,inactive'],
        ]);

        $size->update($data);

        return $size;
    }

    public function destroy(Size $size)
    {
        $size->delete();

        return response()->json(null, 204);
    }
}
