<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LeadQuickCaptureTest extends TestCase
{
    use RefreshDatabase;

    public function test_assigns_to_the_matching_specialist_with_the_fewest_open_leads(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $busySpecialist = User::factory()->create(['role' => 'sales', 'specialization' => 'healthcare_erp', 'is_active' => true]);
        $freeSpecialist = User::factory()->create(['role' => 'sales', 'specialization' => 'healthcare_erp', 'is_active' => true]);
        $otherSpecialist = User::factory()->create(['role' => 'sales', 'specialization' => 'basic_crm', 'is_active' => true]);

        // Give the "busy" specialist 2 open leads, the "free" one none.
        Lead::create(['name' => 'Existing A', 'assigned_to' => $busySpecialist->id, 'status' => 'new']);
        Lead::create(['name' => 'Existing B', 'assigned_to' => $busySpecialist->id, 'status' => 'new']);
        // A won lead shouldn't count as "open" load.
        Lead::create(['name' => 'Existing C', 'assigned_to' => $busySpecialist->id, 'status' => 'won']);

        $response = $this->postJson('/api/leads/quick-capture', [
            'name' => 'Prospect A',
            'interest' => 'healthcare_erp',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('assigned_to', $freeSpecialist->id);
        $this->assertNotSame($otherSpecialist->id, $response->json('assigned_to'));
    }

    public function test_stamps_a_default_follow_up_date_two_days_out(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->postJson('/api/leads/quick-capture', ['name' => 'Prospect B']);

        $response->assertCreated();
        $this->assertStringStartsWith(now()->addDays(2)->toDateString(), $response->json('follow_up_date'));
    }

    public function test_falls_back_to_any_sales_user_when_no_specialist_matches(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $generalSales = User::factory()->create(['role' => 'sales', 'specialization' => 'general', 'is_active' => true]);

        $response = $this->postJson('/api/leads/quick-capture', [
            'name' => 'Prospect C',
            'interest' => 'automation_crm',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('assigned_to', $generalSales->id);
    }

    public function test_leaves_unassigned_when_no_sales_users_exist(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $response = $this->postJson('/api/leads/quick-capture', ['name' => 'Prospect D']);

        $response->assertCreated();
        $response->assertJsonPath('assigned_to', null);
    }
}
