<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use Illuminate\Http\Request;

class DeliveryController extends Controller
{
    public function index(Request $request)
    {
        $query = Delivery::with(['productionOrder', 'contact']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('production_order_id')) {
            $query->where('production_order_id', $request->integer('production_order_id'));
        }

        return $query->latest()->paginate($request->integer('per_page', 15));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'production_order_id' => ['required', 'exists:production_orders,id'],
            'contact_id' => ['required', 'exists:contacts,id'],
            'delivery_date' => ['nullable', 'date'],
            'delivery_address' => ['nullable', 'string'],
            'status' => ['nullable', 'in:pending,dispatched,delivered,returned'],
            'tracking_no' => ['nullable', 'string', 'max:100'],
            'delivered_by' => ['nullable', 'string', 'max:100'],
            'remarks' => ['nullable', 'string'],
        ]);

        $data['created_by'] = $request->user()->id;

        $delivery = Delivery::create($data);
        $delivery->update(['delivery_no' => sprintf('DLV-%05d', $delivery->id)]);

        if ($delivery->status === 'delivered') {
            $delivery->productionOrder()->update(['status' => 'delivered']);
        }

        return response()->json($delivery->load(['productionOrder', 'contact']), 201);
    }

    public function show(Delivery $delivery)
    {
        return $delivery->load(['productionOrder', 'contact']);
    }

    public function update(Request $request, Delivery $delivery)
    {
        $data = $request->validate([
            'delivery_date' => ['nullable', 'date'],
            'delivery_address' => ['nullable', 'string'],
            'status' => ['nullable', 'in:pending,dispatched,delivered,returned'],
            'tracking_no' => ['nullable', 'string', 'max:100'],
            'delivered_by' => ['nullable', 'string', 'max:100'],
            'remarks' => ['nullable', 'string'],
        ]);

        $delivery->update($data);

        if (($data['status'] ?? null) === 'delivered') {
            $delivery->productionOrder()->update(['status' => 'delivered']);
        }

        return $delivery->load(['productionOrder', 'contact']);
    }

    public function destroy(Delivery $delivery)
    {
        $delivery->delete();

        return response()->json(null, 204);
    }
}
