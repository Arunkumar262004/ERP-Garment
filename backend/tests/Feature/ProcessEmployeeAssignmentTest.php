<?php

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\ProductionOrder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProcessEmployeeAssignmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_contacts_can_be_filtered_by_category(): void
    {
        Sanctum::actingAs(User::factory()->create());

        Contact::create(['type' => 'employee', 'name' => 'Anita Verma', 'category' => 'cutting']);
        Contact::create(['type' => 'employee', 'name' => 'Ravi Singh', 'category' => 'stitching']);

        $response = $this->getJson('/api/contacts?type=employee&category=cutting');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.name', 'Anita Verma');
    }

    public function test_a_process_can_be_assigned_to_an_employee(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $customer = Contact::create(['type' => 'b2b', 'name' => 'Kumar Textiles']);
        $employee = Contact::create(['type' => 'employee', 'name' => 'Anita Verma', 'category' => 'cutting']);

        $order = ProductionOrder::create([
            'contact_id' => $customer->id,
            'order_no' => 'PRD-00001',
            'order_date' => now()->toDateString(),
            'status' => 'pending',
            'total_quantity' => 500,
        ]);

        $process = $order->processes()->create(['process_type' => 'cutting', 'sequence' => 1, 'status' => 'pending']);

        $response = $this->putJson("/api/production-processes/{$process->id}", [
            'assigned_employee_id' => $employee->id,
        ]);

        $response->assertOk();
        $this->assertSame($employee->id, $process->fresh()->assigned_employee_id);
        $this->assertSame('Anita Verma', $process->fresh()->employee->name);
    }
}
