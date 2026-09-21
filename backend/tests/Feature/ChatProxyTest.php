<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ChatProxyTest extends TestCase
{
    use RefreshDatabase;

    public function test_forwards_the_message_to_n8n_and_returns_its_reply(): void
    {
        config(['services.n8n.chat_webhook_url' => 'https://n8n.example.test/webhook/chat']);

        Http::fake([
            'n8n.example.test/*' => Http::response(['output' => 'B2B-00011 is Kumar Textiles Pvt Ltd.']),
        ]);

        Sanctum::actingAs($user = User::factory()->create());

        $response = $this->postJson('/api/chat/ask', ['message' => 'what is the company of B2B-00011']);

        $response->assertOk();
        $response->assertJson(['reply' => 'B2B-00011 is Kumar Textiles Pvt Ltd.']);

        Http::assertSent(function ($request) use ($user) {
            return $request->url() === 'https://n8n.example.test/webhook/chat'
                && $request['chatInput'] === 'what is the company of B2B-00011'
                && $request['sessionId'] === 'erp-user-'.$user->id;
        });
    }

    public function test_returns_a_friendly_error_when_n8n_is_unreachable(): void
    {
        config(['services.n8n.chat_webhook_url' => 'https://n8n.example.test/webhook/chat']);

        Http::fake(['n8n.example.test/*' => Http::response(null, 500)]);

        Sanctum::actingAs(User::factory()->create());

        $response = $this->postJson('/api/chat/ask', ['message' => 'hello']);

        $response->assertStatus(502);
        $response->assertJsonMissing(['error']);
    }

    public function test_requires_authentication(): void
    {
        $this->postJson('/api/chat/ask', ['message' => 'hello'])->assertUnauthorized();
    }

    public function test_requires_a_message(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/chat/ask', [])->assertUnprocessable();
    }
}
