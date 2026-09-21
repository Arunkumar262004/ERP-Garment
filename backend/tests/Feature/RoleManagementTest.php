<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RoleManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_admin_can_create_a_role_with_module_permissions(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $response = $this->postJson('/api/admin/roles', [
            'name' => 'Cutting Lead',
            'permissions' => ['dashboard', 'production', 'purchase.raw-materials'],
        ]);

        $response->assertCreated();
        $response->assertJsonPath('name', 'Cutting Lead');

        $role = Role::where('name', 'Cutting Lead')->first();
        $this->assertEqualsCanonicalizing(['dashboard', 'production', 'purchase.raw-materials'], $role->permissions);
    }

    public function test_creating_a_role_rejects_an_unknown_permission_key(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $response = $this->postJson('/api/admin/roles', [
            'name' => 'Bad Role',
            'permissions' => ['not-a-real-module'],
        ]);

        $response->assertStatus(422);
    }

    public function test_a_non_admin_cannot_manage_roles(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'sales']));

        $this->getJson('/api/admin/roles')->assertForbidden();
        $this->postJson('/api/admin/roles', ['name' => 'X'])->assertForbidden();
    }

    public function test_a_user_can_be_assigned_a_role_and_it_is_returned_on_login(): void
    {
        $role = Role::create(['name' => 'Cutting Lead', 'permissions' => ['dashboard', 'production']]);
        $user = User::factory()->create(['role' => 'production', 'role_id' => $role->id]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/me');

        $response->assertOk();
        $response->assertJsonPath('assigned_role.name', 'Cutting Lead');
        $response->assertJsonPath('assigned_role.permissions', ['dashboard', 'production']);
    }
}
