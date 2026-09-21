<?php

namespace App\Listeners;

use App\Events\LeadCreated;
use App\Mail\SalesUpdateMail;
use App\Services\MailService;
use App\Services\WasenderService;

/**
 * Notifies both sides of a new lead: a WhatsApp receipt confirmation to the
 * lead's own number (if given), and a WhatsApp + email assignment alert to
 * the sales rep it was routed to (if any, and if they have that contact
 * info on file).
 */
class SendLeadCreatedWhatsApp
{
    public function __construct(protected WasenderService $wasender, protected MailService $mail) {}

    public function handle(LeadCreated $event): void
    {
        $lead = $event->lead->loadMissing('assignee');

        if ($lead->phone) {
            $this->wasender->sendText(
                $lead->phone,
                "Hi {$lead->name}, thanks for reaching out to Garment ERP! We've received your enquiry ({$lead->lead_no}) and someone from our team will contact you shortly."
            );
        }

        if ($lead->assignee) {
            $company = $lead->company_name ? " ({$lead->company_name})" : '';
            $message = "New lead assigned to you: {$lead->lead_no} — {$lead->name}{$company}. Phone: "
                .($lead->phone ?? 'not given').'. Source: '.str_replace('_', ' ', $lead->source).'.';

            if ($lead->assignee->phone) {
                $this->wasender->sendText($lead->assignee->phone, $message);
            }

            if ($lead->assignee->email) {
                $this->mail->send($lead->assignee->email, new SalesUpdateMail("New lead — {$lead->lead_no}", $message));
            }
        }
    }
}
