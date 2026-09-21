<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicLeadCaptureTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.lead_capture.secret' => 'test-secret']);
    }

    public function test_rejects_a_request_without_the_secret_header(): void
    {
        $response = $this->postJson('/api/public/leads', ['name' => 'External Prospect']);

        $response->assertUnauthorized();
    }

    public function test_rejects_a_request_with_the_wrong_secret(): void
    {
        $response = $this->postJson('/api/public/leads', ['name' => 'External Prospect'], [
            'X-Lead-Capture-Secret' => 'wrong',
        ]);

        $response->assertUnauthorized();
    }

    public function test_creates_a_lead_with_the_correct_secret_and_no_login(): void
    {
        $sales = User::factory()->create(['role' => 'sales', 'specialization' => 'general', 'is_active' => true]);

        $response = $this->postJson('/api/public/leads', [
            'name' => 'External Prospect',
            'email' => 'prospect@example.test',
            'interest' => 'general',
        ], [
            'X-Lead-Capture-Secret' => 'test-secret',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('assigned_to', $sales->id);
        $response->assertJsonPath('created_by', null);
    }

    public function test_returns_503_when_no_secret_is_configured(): void
    {
        config(['services.lead_capture.secret' => null]);

        $response = $this->postJson('/api/public/leads', ['name' => 'External Prospect'], [
            'X-Lead-Capture-Secret' => 'anything',
        ]);

        $response->assertStatus(503);
    }
}
