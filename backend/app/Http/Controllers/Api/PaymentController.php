<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = Payment::with('invoice');

        if ($request->filled('invoice_id')) {
            $query->where('invoice_id', $request->integer('invoice_id'));
        }

        return $query->latest()->paginate($request->integer('per_page', 15));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'invoice_id' => ['required', 'exists:invoices,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_date' => ['required', 'date'],
            'payment_method' => ['nullable', 'in:cash,bank_transfer,upi,cheque,card,other'],
            'reference_no' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        $data['created_by'] = $request->user()->id;

        $payment = DB::transaction(function () use ($data) {
            $payment = Payment::create($data);

            /** @var Invoice $invoice */
            $invoice = Invoice::lockForUpdate()->findOrFail($data['invoice_id']);
            $paidAmount = round($invoice->paid_amount + $data['amount'], 2);
            $balance = round($invoice->total - $paidAmount, 2);

            $invoice->update([
                'paid_amount' => $paidAmount,
                'balance_amount' => max($balance, 0),
                'status' => $balance <= 0 ? 'paid' : 'partial',
            ]);

            return $payment;
        });

        return response()->json($payment->load('invoice'), 201);
    }

    public function show(Payment $payment)
    {
        return $payment->load('invoice');
    }

    public function update(Request $request, Payment $payment)
    {
        $data = $request->validate([
            'invoice_id' => ['sometimes', 'exists:invoices,id'],
            'amount' => ['sometimes', 'numeric', 'min:0.01'],
            'payment_date' => ['sometimes', 'date'],
            'payment_method' => ['nullable', 'in:cash,bank_transfer,upi,cheque,card,other'],
            'reference_no' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($data, $payment) {
            // Reverse the payment's effect on its current invoice.
            $oldInvoice = Invoice::lockForUpdate()->findOrFail($payment->invoice_id);
            $paidAmount = max(round($oldInvoice->paid_amount - $payment->amount, 2), 0);
            $balance = round($oldInvoice->total - $paidAmount, 2);

            $oldInvoice->update([
                'paid_amount' => $paidAmount,
                'balance_amount' => $balance,
                'status' => $paidAmount <= 0 ? 'sent' : ($balance <= 0 ? 'paid' : 'partial'),
            ]);

            // Apply the new amount to the target invoice (same invoice, or a new one).
            $targetInvoiceId = $data['invoice_id'] ?? $payment->invoice_id;
            $newAmount = $data['amount'] ?? $payment->amount;

            $targetInvoice = $targetInvoiceId === $oldInvoice->id
                ? $oldInvoice
                : Invoice::lockForUpdate()->findOrFail($targetInvoiceId);

            $paidAmount = round($targetInvoice->paid_amount + $newAmount, 2);
            $balance = round($targetInvoice->total - $paidAmount, 2);

            $targetInvoice->update([
                'paid_amount' => $paidAmount,
                'balance_amount' => max($balance, 0),
                'status' => $balance <= 0 ? 'paid' : 'partial',
            ]);

            $payment->update($data);
        });

        return $payment->fresh()->load('invoice');
    }

    public function destroy(Payment $payment)
    {
        DB::transaction(function () use ($payment) {
            $invoice = Invoice::lockForUpdate()->findOrFail($payment->invoice_id);
            $paidAmount = max(round($invoice->paid_amount - $payment->amount, 2), 0);
            $balance = round($invoice->total - $paidAmount, 2);

            $invoice->update([
                'paid_amount' => $paidAmount,
                'balance_amount' => $balance,
                'status' => $paidAmount <= 0 ? 'sent' : ($balance <= 0 ? 'paid' : 'partial'),
            ]);

            $payment->delete();
        });

        return response()->json(null, 204);
    }
}
