<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
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
        $query = Invoice::with('contact');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('contact_id')) {
            $query->where('contact_id', $request->integer('contact_id'));
        }

        if ($request->filled('search')) {
            $query->where('invoice_no', 'like', '%'.$request->string('search').'%');
        }

        return $query->latest()->paginate($request->integer('per_page', 15));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'contact_id' => ['required', 'exists:contacts,id'],
            'quotation_id' => ['nullable', 'exists:quotations,id'],
            'invoice_date' => ['required', 'date'],
            'due_date' => ['nullable', 'date'],
            'status' => ['nullable', 'in:draft,sent,paid,partial,overdue,cancelled'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit' => ['nullable', 'string', 'max:30'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.tax_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $totals = $this->computeTotals($data['items'], $data['discount'] ?? 0);

        $invoice = DB::transaction(function () use ($data, $totals, $request) {
            $invoice = Invoice::create([
                'contact_id' => $data['contact_id'],
                'quotation_id' => $data['quotation_id'] ?? null,
                'invoice_date' => $data['invoice_date'],
                'due_date' => $data['due_date'] ?? null,
                'status' => $data['status'] ?? 'draft',
                'discount' => $data['discount'] ?? 0,
                'notes' => $data['notes'] ?? null,
                'balance_amount' => $totals['total'],
                'created_by' => $request->user()->id,
                ...$totals,
            ]);

            $invoice->update(['invoice_no' => sprintf('INV-%05d', $invoice->id)]);

            foreach ($data['items'] as $item) {
                $lineTotal = $item['quantity'] * $item['unit_price'];
                $lineTotal += $lineTotal * (($item['tax_percent'] ?? 0) / 100);
                $invoice->items()->create([...$item, 'total' => round($lineTotal, 2)]);
            }

            return $invoice;
        });

        return response()->json($invoice->load(['contact', 'items']), 201);
    }

    public function show(Invoice $invoice)
    {
        return $invoice->load(['contact', 'items', 'payments', 'quotation']);
    }

    public function update(Request $request, Invoice $invoice)
    {
        $data = $request->validate([
            'contact_id' => ['sometimes', 'exists:contacts,id'],
            'quotation_id' => ['nullable', 'exists:quotations,id'],
            'invoice_date' => ['sometimes', 'date'],
            'due_date' => ['nullable', 'date'],
            'status' => ['nullable', 'in:draft,sent,paid,partial,overdue,cancelled'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'items' => ['sometimes', 'array', 'min:1'],
            'items.*.description' => ['required_with:items', 'string', 'max:255'],
            'items.*.quantity' => ['required_with:items', 'numeric', 'min:0.01'],
            'items.*.unit' => ['nullable', 'string', 'max:30'],
            'items.*.unit_price' => ['required_with:items', 'numeric', 'min:0'],
            'items.*.tax_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        DB::transaction(function () use ($data, $invoice) {
            if (isset($data['items'])) {
                $totals = $this->computeTotals($data['items'], $data['discount'] ?? $invoice->discount);
                $invoice->items()->delete();
                foreach ($data['items'] as $item) {
                    $lineTotal = $item['quantity'] * $item['unit_price'];
                    $lineTotal += $lineTotal * (($item['tax_percent'] ?? 0) / 100);
                    $invoice->items()->create([...$item, 'total' => round($lineTotal, 2)]);
                }
                $data = array_merge($data, $totals, [
                    'balance_amount' => round($totals['total'] - $invoice->paid_amount, 2),
                ]);
                unset($data['items']);
            }

            $invoice->update($data);
        });

        return $invoice->load(['contact', 'items', 'payments']);
    }

    public function destroy(Invoice $invoice)
    {
        $invoice->delete();

        return response()->json(null, 204);
    }
}
