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
}
