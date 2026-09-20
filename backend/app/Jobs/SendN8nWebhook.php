<?php

namespace App\Jobs;

use App\Services\N8nService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class SendN8nWebhook implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    /** @var array<int, int> */
    public array $backoff = [10, 30, 60];

    public function __construct(
        public readonly array $payload,
        public readonly ?string $webhookUrl = null,
    ) {}

    public function handle(N8nService $n8n): void
    {
        $delivered = $n8n->send($this->payload, $this->webhookUrl);

        if ($delivered) {
            return;
        }

        if ($this->attempts() < $this->tries) {
            $this->release($this->backoff[$this->attempts() - 1] ?? 60);

            return;
        }

        $this->fail(new \RuntimeException('N8n webhook delivery failed after max attempts'));
    }

    public function failed(?Throwable $exception): void
    {
        Log::error('N8n webhook permanently failed', [
            'event' => $this->payload['event'] ?? null,
            'event_id' => $this->payload['event_id'] ?? null,
            'error' => $exception?->getMessage(),
        ]);
    }
}
