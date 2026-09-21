<?php

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\Lead;
use App\Models\ProductionOrder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LookupTest extends TestCase
{
    use RefreshDatabase;

    public function test_looks_up_a_contact_by_code_and_returns_full_record(): void
    {
        Contact::create([
            'type' => 'b2b',
            'code' => 'B2B-00011',
            'name' => 'Rajesh Kumar',
            'company_name' => 'Kumar Textiles Pvt Ltd',
            'email' => 'rajesh@kumartextiles.test',
        ]);

        Sanctum::actingAs(User::factory()->create());

        $response = $this->getJson('/api/lookup/B2B-00011');

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

        Sanctum::actingAs(User::factory()->create());

        $response = $this->getJson('/api/lookup/prd-00003');

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

        Sanctum::actingAs(User::factory()->create());

        $response = $this->getJson('/api/lookup/LEAD-00001');

        $response->assertOk();
        $response->assertJson([
            'found' => true,
            'code' => 'LEAD-00001',
            'data' => ['company_name' => 'Kumar Textiles Pvt Ltd'],
        ]);
    }

    public function test_returns_not_found_for_an_unknown_code(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->getJson('/api/lookup/PRD-99999');

        $response->assertStatus(404);
        $response->assertJson(['found' => false]);
    }

    public function test_requires_authentication(): void
    {
        $this->getJson('/api/lookup/PRD-00001')->assertUnauthorized();
    }
}
