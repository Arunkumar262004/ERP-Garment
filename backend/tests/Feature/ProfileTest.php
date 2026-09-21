<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_can_update_their_own_name_and_email(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->putJson('/api/profile', [
            'name' => 'Updated Name',
            'email' => 'updated@example.test',
        ]);

        $response->assertOk();
        $this->assertSame('Updated Name', $user->fresh()->name);
        $this->assertSame('updated@example.test', $user->fresh()->email);
    }

    public function test_changing_password_with_correct_current_password_succeeds_and_can_be_used_to_login(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->putJson('/api/profile/password', [
            'current_password' => 'password',
            'new_password' => 'newpassword123',
            'new_password_confirmation' => 'newpassword123',
        ]);

        $response->assertOk();

        $login = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'newpassword123',
        ]);

        $login->assertOk();
    }

    public function test_changing_password_with_wrong_current_password_returns_a_validation_error(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->putJson('/api/profile/password', [
            'current_password' => 'wrong-password',
            'new_password' => 'newpassword123',
            'new_password_confirmation' => 'newpassword123',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('current_password');
    }
}
