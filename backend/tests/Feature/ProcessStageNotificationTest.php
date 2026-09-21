<?php

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\ProductionOrder;
use App\Models\User;
use App\Notifications\ProcessStageChangedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProcessStageNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function makeOrderWithProcess(?User $assignee = null): array
    {
        $contact = Contact::create(['type' => 'b2b', 'name' => 'Kumar Textiles']);
        $order = ProductionOrder::create([
            'contact_id' => $contact->id,
            'order_no' => 'PRD-00001',
            'order_date' => now()->toDateString(),
            'status' => 'pending',
            'total_quantity' => 500,
        ]);
        $process = $order->processes()->create([
            'process_type' => 'cutting',
            'sequence' => 1,
            'status' => 'pending',
            'assigned_to' => $assignee?->id,
        ]);

        return [$order, $process];
    }

    public function test_changing_status_notifies_the_assigned_user(): void
    {
        Notification::fake();
        $assignee = User::factory()->create();
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        [, $process] = $this->makeOrderWithProcess($assignee);

        $this->putJson("/api/production-processes/{$process->id}", ['status' => 'in_progress'])->assertOk();

        Notification::assertSentTo($assignee, ProcessStageChangedNotification::class, function ($notification) {
            return $notification->fromStatus === 'pending' && $notification->toStatus === 'in_progress';
        });
    }

    public function test_no_notification_when_status_is_unchanged(): void
    {
        Notification::fake();
        $assignee = User::factory()->create();
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        [, $process] = $this->makeOrderWithProcess($assignee);

        $this->putJson("/api/production-processes/{$process->id}", ['remarks' => 'just a note'])->assertOk();

        Notification::assertNothingSent();
    }

    public function test_no_notification_when_nobody_is_assigned(): void
    {
        Notification::fake();
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        [, $process] = $this->makeOrderWithProcess(null);

        $this->putJson("/api/production-processes/{$process->id}", ['status' => 'in_progress'])->assertOk();

        Notification::assertNothingSent();
    }

    public function test_a_user_can_list_and_mark_read_their_own_notifications(): void
    {
        $assignee = User::factory()->create();
        Sanctum::actingAs($assignee);
        [, $process] = $this->makeOrderWithProcess($assignee);

        // Trigger a real (non-faked) notification so it lands in the database.
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->putJson("/api/production-processes/{$process->id}", ['status' => 'in_progress'])->assertOk();

        Sanctum::actingAs($assignee);
        $list = $this->getJson('/api/notifications');
        $list->assertOk();
        $list->assertJsonCount(1, 'data');
        $notificationId = $list->json('data.0.id');

        $this->postJson("/api/notifications/{$notificationId}/read")->assertNoContent();

        $this->assertNotNull($assignee->notifications()->find($notificationId)->read_at);
    }
}
