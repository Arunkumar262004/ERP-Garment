<?php

namespace App\Listeners\Concerns;

use App\Mail\SalesUpdateMail;
use App\Models\Contact;
use App\Services\MailService;
use App\Services\WasenderService;

/**
 * Shared by every listener that updates a customer's sales owner (the rep
 * their original lead was assigned to) about something happening on their
 * account — a new quotation, invoice, or production order, or one of those
 * completing. Sends both WhatsApp and email, same short message either way.
 */
trait NotifiesSalesOwner
{
    protected function notifySalesOwner(WasenderService $wasender, ?Contact $contact, string $subject, string $message): void
    {
        $owner = $contact?->salesOwner();

        if (! $owner) {
            return;
        }

        if ($owner->phone) {
            $wasender->sendText($owner->phone, $message);
        }

        if ($owner->email) {
            app(MailService::class)->send($owner->email, new SalesUpdateMail($subject, $message));
        }
    }
}
