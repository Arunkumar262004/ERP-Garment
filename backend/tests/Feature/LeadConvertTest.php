<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LeadConvertTest extends TestCase
{
    use RefreshDatabase;

    public function test_converting_a_lead_with_a_company_name_creates_a_b2b_contact(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $lead = Lead::create(['name' => 'Rajesh Kumar', 'company_name' => 'Kumar Textiles', 'email' => 'r@k.test']);

        $response = $this->postJson("/api/leads/{$lead->id}/convert");

        $response->assertOk();
        $response->assertJsonPath('status', 'won');
        $response->assertJsonPath('contact.type', 'b2b');
        $response->assertJsonPath('contact.name', 'Rajesh Kumar');

        $this->assertNotNull($lead->fresh()->contact_id);
    }

    public function test_converting_a_lead_without_a_company_name_creates_a_b2c_contact(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $lead = Lead::create(['name' => 'Priya Sharma']);

        $response = $this->postJson("/api/leads/{$lead->id}/convert");

        $response->assertOk();
        $response->assertJsonPath('contact.type', 'b2c');
    }

    public function test_an_explicit_type_overrides_the_company_name_guess(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $lead = Lead::create(['name' => 'Rajesh Kumar', 'company_name' => 'Kumar Textiles']);

        $response = $this->postJson("/api/leads/{$lead->id}/convert", ['type' => 'b2c']);

        $response->assertOk();
        $response->assertJsonPath('contact.type', 'b2c');
    }

    public function test_converting_an_already_converted_lead_is_a_noop(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $lead = Lead::create(['name' => 'Rajesh Kumar', 'company_name' => 'Kumar Textiles']);
        $this->postJson("/api/leads/{$lead->id}/convert");
        $firstContactId = $lead->fresh()->contact_id;

        $this->postJson("/api/leads/{$lead->id}/convert");

        $this->assertSame($firstContactId, $lead->fresh()->contact_id);
    }
}
