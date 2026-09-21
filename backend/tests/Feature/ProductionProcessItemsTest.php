<?php

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\ProductionOrder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProductionProcessItemsTest extends TestCase
{
    use RefreshDatabase;

    protected function makeOrderWithOneItem(): ProductionOrder
    {
        $contact = Contact::create(['type' => 'b2b', 'name' => 'Kumar Textiles']);

        $order = ProductionOrder::create([
            'contact_id' => $contact->id,
            'order_no' => 'PRD-00001',
            'order_date' => now()->toDateString(),
            'status' => 'pending',
            'total_quantity' => 500,
        ]);

        $order->items()->create(['item_name' => 'Cotton Shirt', 'quantity' => 500, 'unit' => 'pcs']);

        return $order;
    }

    public function test_creating_a_process_auto_imports_the_items_that_exist_at_that_time(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $order = $this->makeOrderWithOneItem();

        $response = $this->postJson("/api/production-orders/{$order->id}/processes", [
            'process_type' => 'cutting',
        ]);

        $response->assertCreated();
        $process = $order->processes()->first();
        $this->assertCount(1, $process->items);
        $this->assertSame('Cotton Shirt', $process->items->first()->item_name);
    }

    public function test_an_item_added_after_process_creation_is_missed_until_explicitly_imported(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $order = $this->makeOrderWithOneItem();

        $process = $order->processes()->create([
            'process_type' => 'cutting',
            'sequence' => 1,
            'status' => 'pending',
        ]);
        $process->items()->attach($order->items()->first()->id, ['imported_at' => now()]);

        // Simulate the order gaining a second line item after the process already exists.
        $newItem = $order->items()->create(['item_name' => 'Pant', 'quantity' => 800, 'unit' => 'pcs']);

        $this->assertCount(1, $process->fresh()->items);

        $response = $this->postJson("/api/production-processes/{$process->id}/import-missed-items");

        $response->assertOk();
        $response->assertJson(['imported' => [$newItem->id]]);

        $process->refresh();
        $this->assertCount(2, $process->items);
        $this->assertTrue($process->items->pluck('id')->contains($newItem->id));
    }

    public function test_import_missed_items_is_a_noop_when_nothing_is_missing(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $order = $this->makeOrderWithOneItem();

        $this->postJson("/api/production-orders/{$order->id}/processes", ['process_type' => 'cutting']);
        $process = $order->processes()->first();

        $response = $this->postJson("/api/production-processes/{$process->id}/import-missed-items");

        $response->assertOk();
        $response->assertJson(['imported' => []]);
        $this->assertCount(1, $process->fresh()->items);
    }
}
