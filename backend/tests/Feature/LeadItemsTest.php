<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LeadItemsTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_a_lead_with_items_persists_them_and_the_follow_up_date(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->postJson('/api/leads', [
            'name' => 'Test Lead',
            'follow_up_date' => '2026-10-01',
            'items' => [
                [
                    'description' => 'Cotton T-Shirts',
                    'quantity' => 100,
                    'unit' => 'pcs',
                    'target_price' => 250.50,
                    'delivery_date' => '2026-11-01',
                ],
                [
                    'description' => 'Polo Shirts',
                    'quantity' => 50,
                ],
            ],
        ]);

        $response->assertCreated();
        $response->assertJsonCount(2, 'items');

        $lead = Lead::first();
        $this->assertSame('2026-10-01', $lead->follow_up_date->toDateString());
        $this->assertCount(2, $lead->items);
        $this->assertSame('Cotton T-Shirts', $lead->items->first()->description);
    }

    public function test_updating_a_leads_items_replaces_the_old_set_with_the_new_one(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $lead = Lead::create([
            'name' => 'Test Lead',
        ]);

        $lead->items()->create([
            'description' => 'Old Item',
            'quantity' => 10,
        ]);

        $response = $this->putJson("/api/leads/{$lead->id}", [
            'items' => [
                [
                    'description' => 'New Item A',
                    'quantity' => 20,
                ],
                [
                    'description' => 'New Item B',
                    'quantity' => 30,
                ],
            ],
        ]);

        $response->assertOk();
        $response->assertJsonCount(2, 'items');

        $lead->refresh();
        $this->assertCount(2, $lead->items);
        $this->assertEqualsCanonicalizing(
            ['New Item A', 'New Item B'],
            $lead->items->pluck('description')->all()
        );
    }

    public function test_updating_a_lead_without_items_leaves_existing_items_untouched(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $lead = Lead::create([
            'name' => 'Test Lead',
        ]);

        $lead->items()->create([
            'description' => 'Keep Me',
            'quantity' => 5,
        ]);

        $response = $this->putJson("/api/leads/{$lead->id}", [
            'name' => 'Updated Name',
        ]);

        $response->assertOk();

        $lead->refresh();
        $this->assertSame('Updated Name', $lead->name);
        $this->assertCount(1, $lead->items);
    }
}
