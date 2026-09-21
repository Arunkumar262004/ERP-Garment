<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminUserManagementTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    public function test_an_admin_can_create_a_user(): void
    {
        Sanctum::actingAs($this->admin());

        $response = $this->postJson('/api/admin/users', [
            'name' => 'New Staffer',
            'email' => 'staffer@example.test',
            'password' => 'password123',
            'role' => 'sales',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('users', [
            'email' => 'staffer@example.test',
            'role' => 'sales',
        ]);
    }

    public function test_an_admin_can_update_a_user(): void
    {
        Sanctum::actingAs($this->admin());
        $user = User::factory()->create(['role' => 'sales']);

        $response = $this->putJson("/api/admin/users/{$user->id}", [
            'role' => 'accounts',
        ]);

        $response->assertOk();
        $this->assertSame('accounts', $user->fresh()->role);
    }

    public function test_an_admin_can_set_a_users_specialization(): void
    {
        Sanctum::actingAs($this->admin());
        $user = User::factory()->create(['role' => 'sales']);

        $response = $this->putJson("/api/admin/users/{$user->id}", [
            'specialization' => 'healthcare_erp',
        ]);

        $response->assertOk();
        $this->assertSame('healthcare_erp', $user->fresh()->specialization);
    }

    public function test_an_admin_can_deactivate_a_user(): void
    {
        Sanctum::actingAs($this->admin());
        $user = User::factory()->create(['is_active' => true]);

        $response = $this->deleteJson("/api/admin/users/{$user->id}");

        $response->assertNoContent();

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'is_active' => false,
        ]);
    }

    public function test_a_non_admin_receives_403_on_all_admin_user_endpoints(): void
    {
        $nonAdmin = User::factory()->create(['role' => 'sales']);
        $otherUser = User::factory()->create();

        Sanctum::actingAs($nonAdmin);

        $this->getJson('/api/admin/users')->assertStatus(403);
        $this->postJson('/api/admin/users', [
            'name' => 'X',
            'email' => 'x@example.test',
            'password' => 'password123',
            'role' => 'sales',
        ])->assertStatus(403);
        $this->putJson("/api/admin/users/{$otherUser->id}", ['name' => 'Y'])->assertStatus(403);
        $this->deleteJson("/api/admin/users/{$otherUser->id}")->assertStatus(403);
    }

    public function test_an_admin_cannot_deactivate_their_own_account(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $response = $this->deleteJson("/api/admin/users/{$admin->id}");

        $response->assertStatus(422);
        $this->assertTrue($admin->fresh()->is_active);
    }
}
