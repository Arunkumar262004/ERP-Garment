<?php

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\ProductionOrder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProductionOrderItemCrudTest extends TestCase
{
    use RefreshDatabase;

    protected function makeOrder(): ProductionOrder
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

    public function test_adding_an_item_via_a_process_imports_it_into_that_process_and_updates_the_order_total(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $order = $this->makeOrder();
        $process = $order->processes()->create(['process_type' => 'cutting', 'sequence' => 1, 'status' => 'pending']);

        $response = $this->postJson("/api/production-orders/{$order->id}/items", [
            'item_name' => 'Pant',
            'quantity' => 800,
            'unit' => 'pcs',
            'production_process_id' => $process->id,
        ]);

        $response->assertCreated();

        $order->refresh();
        $this->assertSame('1300.00', $order->total_quantity);
        $this->assertCount(2, $order->items);

        $newItemId = $response->json('id');
        $this->assertTrue($process->items()->pluck('production_order_items.id')->contains($newItemId));
    }

    public function test_updating_an_items_quantity_recalculates_the_order_total(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $order = $this->makeOrder();
        $item = $order->items()->first();

        $response = $this->putJson("/api/production-orders/{$order->id}/items/{$item->id}", [
            'quantity' => 650,
        ]);

        $response->assertOk();
        $this->assertSame('650.00', $order->fresh()->total_quantity);
    }

    public function test_deleting_an_item_removes_it_and_recalculates_the_order_total(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $order = $this->makeOrder();
        $extra = $order->items()->create(['item_name' => 'Pant', 'quantity' => 300, 'unit' => 'pcs']);

        $response = $this->deleteJson("/api/production-orders/{$order->id}/items/{$extra->id}");

        $response->assertNoContent();
        $order->refresh();
        $this->assertCount(1, $order->items);
        $this->assertSame('500.00', $order->total_quantity);
    }
}
