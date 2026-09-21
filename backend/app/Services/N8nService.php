<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class N8nService
{
    /**
     * Deliver an automation event payload to n8n.
     *
     * Never throws — a temporary n8n outage must never bubble back into the
     * business action that triggered it. Callers (queued jobs) inspect the
     * boolean result to decide whether to retry.
     */
    public function send(array $payload, ?string $webhookUrl = null): bool
    {
        $url = $webhookUrl ?? config('services.n8n.quotation_webhook_url');

        if (! $url) {
            Log::warning('N8n webhook skipped: no webhook URL configured', [
                'event' => $payload['event'] ?? null,
            ]);

            return false;
        }

        try {
            $response = Http::timeout(5)
                ->withHeaders([
                    'X-N8N-Webhook-Secret' => config('services.n8n.webhook_secret'),
                ])
                ->post($url, $payload);

            if ($response->failed()) {
                Log::warning('N8n webhook responded with an error status', [
                    'event' => $payload['event'] ?? null,
                    'event_id' => $payload['event_id'] ?? null,
                    'status' => $response->status(),
                ]);

                return false;
            }

            return true;
        } catch (Throwable $e) {
            Log::warning('N8n webhook delivery failed', [
                'event' => $payload['event'] ?? null,
                'event_id' => $payload['event_id'] ?? null,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Forward a chat message to the n8n AI Agent workflow and return its
     * reply. Synchronous (unlike send()) since the user is waiting on an
     * answer — returns null on any failure so the caller can show a
     * friendly error instead of leaking n8n/HTTP details.
     */
    public function askChat(string $message, string $sessionId): ?string
    {
        $url = config('services.n8n.chat_webhook_url');

        if (! $url) {
            Log::warning('N8n chat skipped: no chat webhook URL configured');

            return null;
        }

        try {
            $response = Http::timeout(30)->post($url, [
                'chatInput' => $message,
                'sessionId' => $sessionId,
            ]);

            if ($response->failed()) {
                Log::warning('N8n chat webhook responded with an error status', [
                    'status' => $response->status(),
                ]);

                return null;
            }

            return $response->json('output') ?? $response->json('reply');
        } catch (Throwable $e) {
            Log::warning('N8n chat webhook request failed', [
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }
}
