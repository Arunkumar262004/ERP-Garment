<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quotation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuotationController extends Controller
{
    protected function itemRules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit' => ['nullable', 'string', 'max:30'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.tax_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }

    protected function computeTotals(array $items, float $discount = 0): array
    {
        $subtotal = 0;
        $tax = 0;

        foreach ($items as $item) {
            $lineTotal = $item['quantity'] * $item['unit_price'];
            $subtotal += $lineTotal;
            $tax += $lineTotal * (($item['tax_percent'] ?? 0) / 100);
        }

        return [
            'subtotal' => round($subtotal, 2),
            'tax' => round($tax, 2),
            'total' => round($subtotal + $tax - $discount, 2),
        ];
    }

    public function index(Request $request)
    {
        $query = Quotation::with('contact');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('contact_id')) {
            $query->where('contact_id', $request->integer('contact_id'));
        }

        if ($request->filled('search')) {
            $query->where('quotation_no', 'like', '%'.$request->string('search').'%');
        }

        return $query->latest()->paginate($request->integer('per_page', 15));
    }

    public function store(Request $request)
    {
        $data = $request->validate(array_merge([
            'contact_id' => ['required', 'exists:contacts,id'],
            'lead_id' => ['nullable', 'exists:leads,id'],
            'quotation_date' => ['required', 'date'],
            'valid_until' => ['nullable', 'date'],
            'status' => ['nullable', 'in:draft,sent,accepted,rejected,expired'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ], $this->itemRules()));

        $totals = $this->computeTotals($data['items'], $data['discount'] ?? 0);

        $quotation = DB::transaction(function () use ($data, $totals, $request) {
            $quotation = Quotation::create([
                'contact_id' => $data['contact_id'],
                'lead_id' => $data['lead_id'] ?? null,
                'quotation_date' => $data['quotation_date'],
                'valid_until' => $data['valid_until'] ?? null,
                'status' => $data['status'] ?? 'draft',
                'discount' => $data['discount'] ?? 0,
                'notes' => $data['notes'] ?? null,
                'created_by' => $request->user()->id,
                ...$totals,
            ]);

            $quotation->update(['quotation_no' => sprintf('QUO-%05d', $quotation->id)]);

            foreach ($data['items'] as $item) {
                $lineTotal = $item['quantity'] * $item['unit_price'];
                $lineTotal += $lineTotal * (($item['tax_percent'] ?? 0) / 100);
                $quotation->items()->create([...$item, 'total' => round($lineTotal, 2)]);
            }

            return $quotation;
        });

        return response()->json($quotation->load(['contact', 'items']), 201);
    }

    public function show(Quotation $quotation)
    {
        return $quotation->load(['contact', 'items', 'lead', 'invoices']);
    }

    public function update(Request $request, Quotation $quotation)
    {
        $data = $request->validate([
            'contact_id' => ['sometimes', 'exists:contacts,id'],
            'lead_id' => ['nullable', 'exists:leads,id'],
            'quotation_date' => ['sometimes', 'date'],
            'valid_until' => ['nullable', 'date'],
            'status' => ['nullable', 'in:draft,sent,accepted,rejected,expired'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'items' => ['sometimes', 'array', 'min:1'],
            'items.*.description' => ['required_with:items', 'string', 'max:255'],
            'items.*.quantity' => ['required_with:items', 'numeric', 'min:0.01'],
            'items.*.unit' => ['nullable', 'string', 'max:30'],
            'items.*.unit_price' => ['required_with:items', 'numeric', 'min:0'],
            'items.*.tax_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        DB::transaction(function () use ($data, $quotation) {
            if (isset($data['items'])) {
                $totals = $this->computeTotals($data['items'], $data['discount'] ?? $quotation->discount);
                $quotation->items()->delete();
                foreach ($data['items'] as $item) {
                    $lineTotal = $item['quantity'] * $item['unit_price'];
                    $lineTotal += $lineTotal * (($item['tax_percent'] ?? 0) / 100);
                    $quotation->items()->create([...$item, 'total' => round($lineTotal, 2)]);
                }
                $data = array_merge($data, $totals);
                unset($data['items']);
            }

            $quotation->update($data);
        });

        return $quotation->load(['contact', 'items']);
    }

    public function destroy(Quotation $quotation)
    {
        $quotation->delete();

        return response()->json(null, 204);
    }
}
