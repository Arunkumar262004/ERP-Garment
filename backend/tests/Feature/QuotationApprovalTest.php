<?php

namespace Tests\Feature;

use App\Mail\QuotationApprovedMail;
use App\Models\Contact;
use App\Models\Quotation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class QuotationApprovalTest extends TestCase
{
    use RefreshDatabase;

    private function createQuotation(array $overrides = [], array $contactOverrides = []): Quotation
    {
        $contact = Contact::create(array_merge([
            'type' => 'b2b',
            'name' => 'ABC Garments',
        ], $contactOverrides));

        return Quotation::create(array_merge([
            'contact_id' => $contact->id,
            'quotation_date' => now()->toDateString(),
            'status' => 'sent',
            'subtotal' => 100000,
            'discount' => 0,
            'tax' => 25000,
            'total' => 125000,
        ], $overrides));
    }

    public function test_approving_a_quotation_updates_its_status_and_stamps_an_event_id(): void
    {
        $user = User::factory()->create();
        $quotation = $this->createQuotation();

        Sanctum::actingAs($user);

        $response = $this->postJson("/api/quotations/{$quotation->id}/approve");

        $response->assertOk();

        $quotation->refresh();
        $this->assertSame('approved', $quotation->status);
        $this->assertNotNull($quotation->approved_at);
        $this->assertNotNull($quotation->approval_event_id);
    }

    public function test_approving_a_quotation_sends_the_expected_payload_to_n8n(): void
    {
        config(['services.n8n.quotation_webhook_url' => 'https://n8n.example.test/webhook/quotation-approved']);
        config(['services.n8n.webhook_secret' => 'test-secret']);

        Http::fake(['*' => Http::response(['ok' => true], 200)]);

        $user = User::factory()->create();
        $quotation = $this->createQuotation();

        Sanctum::actingAs($user);

        $this->postJson("/api/quotations/{$quotation->id}/approve")->assertOk();

        $quotation->refresh();

        Http::assertSent(function ($request) use ($quotation) {
            return $request->url() === 'https://n8n.example.test/webhook/quotation-approved'
                && $request->hasHeader('X-N8N-Webhook-Secret', 'test-secret')
                && $request['event'] === 'quotation.approved'
                && $request['event_id'] === $quotation->approval_event_id
                && $request['quotation_id'] === $quotation->id
                && $request['customer_name'] === 'ABC Garments'
                && (float) $request['total_amount'] === 125000.0
                && $request['status'] === 'approved';
        });
    }

    public function test_approving_a_quotation_emails_the_customer_when_an_email_is_on_file(): void
    {
        Mail::fake();

        $user = User::factory()->create();
        $quotation = $this->createQuotation(contactOverrides: ['email' => 'buyer@abcgarments.test']);

        Sanctum::actingAs($user);

        $this->postJson("/api/quotations/{$quotation->id}/approve")->assertOk();

        Mail::assertQueued(QuotationApprovedMail::class, function ($mail) use ($quotation) {
            return $mail->hasTo('buyer@abcgarments.test')
                && $mail->quotation->id === $quotation->id;
        });
    }

    public function test_approving_a_quotation_skips_the_email_when_the_contact_has_no_email(): void
    {
        Mail::fake();

        $user = User::factory()->create();
        $quotation = $this->createQuotation();

        Sanctum::actingAs($user);

        $this->postJson("/api/quotations/{$quotation->id}/approve")->assertOk();

        Mail::assertNothingQueued();
    }

    public function test_approving_an_already_approved_quotation_does_not_dispatch_a_duplicate_webhook(): void
    {
        Queue::fake();

        $user = User::factory()->create();
        $quotation = $this->createQuotation([
            'status' => 'approved',
            'approved_at' => now(),
            'approval_event_id' => (string) Str::uuid(),
        ]);

        Sanctum::actingAs($user);

        $this->postJson("/api/quotations/{$quotation->id}/approve")->assertOk();

        Queue::assertNothingPushed();
    }

    public function test_n8n_outage_does_not_fail_the_quotation_approval_request(): void
    {
        config(['services.n8n.quotation_webhook_url' => 'https://n8n.example.test/webhook/quotation-approved']);

        Http::fake(['*' => Http::response(null, 500)]);

        $user = User::factory()->create();
        $quotation = $this->createQuotation();

        Sanctum::actingAs($user);

        $response = $this->postJson("/api/quotations/{$quotation->id}/approve");

        $response->assertOk();
        $this->assertSame('approved', $quotation->fresh()->status);
    }

    public function test_approve_endpoint_requires_authentication(): void
    {
        $quotation = $this->createQuotation();

        $this->postJson("/api/quotations/{$quotation->id}/approve")->assertUnauthorized();
    }

    public function test_n8n_test_endpoint_requires_authentication(): void
    {
        $this->postJson('/api/n8n/test')->assertUnauthorized();
    }

    public function test_n8n_test_endpoint_reports_delivery_failure_without_leaking_details(): void
    {
        config(['services.n8n.quotation_webhook_url' => 'https://n8n.example.test/webhook/quotation-approved']);

        Http::fake(['*' => Http::response(null, 500)]);

        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/n8n/test', ['message' => 'hello']);

        $response->assertStatus(502);
        $response->assertJsonMissing(['error']);
    }

    public function test_existing_generic_update_can_still_change_quotation_status(): void
    {
        $user = User::factory()->create();
        $quotation = $this->createQuotation();

        Sanctum::actingAs($user);

        $response = $this->putJson("/api/quotations/{$quotation->id}", [
            'status' => 'rejected',
        ]);

        $response->assertOk();
        $this->assertSame('rejected', $quotation->fresh()->status);
    }
}
