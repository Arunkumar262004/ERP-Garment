<?php

namespace App\Services;

use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class MailService
{
    /**
     * Deliver an outbound email. Never throws — a bad address, a provider
     * outage, or (in dev) a sandboxed API key rejecting the recipient must
     * never bubble back into the business action that triggered it, the same
     * contract N8nService/WasenderService already hold for their channels.
     * Callers get a boolean if they want to react to a failed send.
     */
    public function send(string $to, Mailable $mailable): bool
    {
        try {
            Mail::to($to)->send($mailable);

            return true;
        } catch (Throwable $e) {
            Log::warning('Email delivery failed', [
                'to' => $to,
                'mailable' => $mailable::class,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
