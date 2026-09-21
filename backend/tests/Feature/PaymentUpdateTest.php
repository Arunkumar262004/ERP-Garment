<?php

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PaymentUpdateTest extends TestCase
{
    use RefreshDatabase;

    private function createInvoice(array $overrides = []): Invoice
    {
        $contact = Contact::create(['type' => 'b2b', 'name' => 'ABC Garments']);

        return Invoice::create(array_merge([
            'contact_id' => $contact->id,
            'invoice_date' => now()->toDateString(),
            'status' => 'sent',
            'total' => 1000,
            'paid_amount' => 0,
            'balance_amount' => 1000,
        ], $overrides));
    }

    public function test_updating_a_payments_amount_recalculates_the_same_invoice(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $invoice = $this->createInvoice(['paid_amount' => 400, 'balance_amount' => 600, 'status' => 'partial']);

        $payment = Payment::create([
            'invoice_id' => $invoice->id,
            'amount' => 400,
            'payment_date' => now()->toDateString(),
        ]);

        $response = $this->putJson("/api/payments/{$payment->id}", [
            'amount' => 1000,
        ]);

        $response->assertOk();

        $invoice->refresh();
        $this->assertSame('1000.00', $invoice->paid_amount);
        $this->assertSame('0.00', $invoice->balance_amount);
        $this->assertSame('paid', $invoice->status);
    }

    public function test_updating_a_payments_invoice_id_moves_it_to_a_different_invoice(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $invoiceA = $this->createInvoice(['paid_amount' => 400, 'balance_amount' => 600, 'status' => 'partial']);
        $invoiceB = $this->createInvoice(['total' => 500, 'paid_amount' => 0, 'balance_amount' => 500]);

        $payment = Payment::create([
            'invoice_id' => $invoiceA->id,
            'amount' => 400,
            'payment_date' => now()->toDateString(),
        ]);

        $response = $this->putJson("/api/payments/{$payment->id}", [
            'invoice_id' => $invoiceB->id,
            'amount' => 500,
        ]);

        $response->assertOk();

        $invoiceA->refresh();
        $invoiceB->refresh();

        // Invoice A should have the payment fully reversed.
        $this->assertSame('0.00', $invoiceA->paid_amount);
        $this->assertSame('1000.00', $invoiceA->balance_amount);
        $this->assertSame('sent', $invoiceA->status);

        // Invoice B should now be fully paid.
        $this->assertSame('500.00', $invoiceB->paid_amount);
        $this->assertSame('0.00', $invoiceB->balance_amount);
        $this->assertSame('paid', $invoiceB->status);

        $this->assertSame($invoiceB->id, $payment->fresh()->invoice_id);
    }
}
