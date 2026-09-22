<?php

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\Lead;
use App\Models\ProductionOrder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LookupTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.n8n.lookup_secret' => 'test-lookup-secret']);
    }

    protected function withSecretHeader(array $headers = []): array
    {
        return ['X-N8N-Lookup-Secret' => 'test-lookup-secret', ...$headers];
    }

    public function test_looks_up_a_contact_by_code_and_returns_full_record(): void
    {
        Contact::create([
            'type' => 'b2b',
            'code' => 'B2B-00011',
            'name' => 'Rajesh Kumar',
            'company_name' => 'Kumar Textiles Pvt Ltd',
            'email' => 'rajesh@kumartextiles.test',
        ]);

        $response = $this->getJson('/api/public/lookup/B2B-00011', $this->withSecretHeader());

        $response->assertOk();
        $response->assertJson([
            'found' => true,
            'code' => 'B2B-00011',
            'data' => [
                'name' => 'Rajesh Kumar',
                'company_name' => 'Kumar Textiles Pvt Ltd',
                'email' => 'rajesh@kumartextiles.test',
            ],
        ]);
    }

    public function test_looks_up_a_production_order_and_includes_current_stage(): void
    {
        $contact = Contact::create(['type' => 'b2b', 'name' => 'ABC Garments']);

        $order = ProductionOrder::create([
            'contact_id' => $contact->id,
            'order_no' => 'PRD-00003',
            'order_date' => now()->toDateString(),
            'status' => 'in_production',
            'total_quantity' => 500,
        ]);

        $order->processes()->create(['process_type' => 'dyeing', 'sequence' => 1, 'status' => 'completed']);
        $order->processes()->create(['process_type' => 'cutting', 'sequence' => 2, 'status' => 'in_progress']);

        $response = $this->getJson('/api/public/lookup/prd-00003', $this->withSecretHeader());

        $response->assertOk();
        $response->assertJson([
            'found' => true,
            'code' => 'PRD-00003',
            'data' => ['current_stage' => 'Cutting'],
        ]);
    }

    public function test_looks_up_a_lead_by_lead_no(): void
    {
        $contact = Contact::create(['type' => 'b2b', 'name' => 'Kumar Textiles Pvt Ltd']);

        Lead::create([
            'lead_no' => 'LEAD-00001',
            'contact_id' => $contact->id,
            'name' => 'Kumar Textiles Pvt Ltd',
            'company_name' => 'Kumar Textiles Pvt Ltd',
            'source' => 'referral',
            'status' => 'qualified',
        ]);

        $response = $this->getJson('/api/public/lookup/LEAD-00001', $this->withSecretHeader());

        $response->assertOk();
        $response->assertJson([
            'found' => true,
            'code' => 'LEAD-00001',
            'data' => ['company_name' => 'Kumar Textiles Pvt Ltd'],
        ]);
    }

    public function test_returns_not_found_for_an_unknown_code(): void
    {
        $response = $this->getJson('/api/public/lookup/PRD-99999', $this->withSecretHeader());

        $response->assertStatus(404);
        $response->assertJson(['found' => false]);
    }

    public function test_rejects_a_request_without_the_secret_header(): void
    {
        $this->getJson('/api/public/lookup/PRD-00001')->assertUnauthorized();
    }

    public function test_rejects_a_request_with_the_wrong_secret(): void
    {
        $response = $this->getJson('/api/public/lookup/PRD-00001', ['X-N8N-Lookup-Secret' => 'wrong']);

        $response->assertUnauthorized();
    }

    public function test_returns_503_when_no_secret_is_configured(): void
    {
        config(['services.n8n.lookup_secret' => null]);

        $response = $this->getJson('/api/public/lookup/PRD-00001', $this->withSecretHeader());

        $response->assertStatus(503);
    }
}
