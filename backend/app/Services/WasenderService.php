<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Thin wrapper over the wasender.dev WhatsApp API. Mirrors N8nService: never
 * throws — a WhatsApp outage or a missing/invalid number must never bubble
 * back into the business action (lead capture, order update, ...) that
 * triggered it.
 */
class WasenderService
{
    public function sendText(?string $phone, string $message): bool
    {
        $token = config('services.wasender.token');

        if (! $token) {
            Log::info('WhatsApp message skipped: no wasender.dev token configured');

            return false;
        }

        $to = $this->normalizePhone($phone);

        if (! $to) {
            Log::info('WhatsApp message skipped: no valid phone number');

            return false;
        }

        try {
            $response = Http::timeout(10)
                ->withToken($token)
                ->post(config('services.wasender.api_url'), [
                    'to' => $to,
                    'body' => $message,
                ]);

            if ($response->failed()) {
                Log::warning('WhatsApp message failed', [
                    'status' => $response->status(),
                ]);

                return false;
            }

            return true;
        } catch (Throwable $e) {
            Log::warning('WhatsApp message delivery failed', [
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * This app stores phone numbers as a bare 10-digit local number (see the
     * `digits:10` validation rule used everywhere a phone is captured).
     * wasender.dev expects the number with a country code and no leading
     * `+` or spaces, so a plain 10-digit Indian mobile number gets `91`
     * prepended. Anything else (already has a country code, has letters,
     * wrong length) is passed through unchanged, or dropped if empty.
     */
    protected function normalizePhone(?string $phone): ?string
    {
        if (! $phone) {
            return null;
        }

        $digits = preg_replace('/\D/', '', $phone);

        if (! $digits) {
            return null;
        }

        return strlen($digits) === 10 ? '91'.$digits : $digits;
    }
}
