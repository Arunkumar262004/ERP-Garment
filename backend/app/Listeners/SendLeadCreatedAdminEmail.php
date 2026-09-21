<?php

namespace App\Listeners;

use App\Events\LeadCreated;
use App\Mail\LeadCreatedMail;
use App\Services\MailService;
use Illuminate\Support\Facades\Log;

class SendLeadCreatedAdminEmail
{
    public function __construct(protected MailService $mail) {}

    public function handle(LeadCreated $event): void
    {
        $adminEmail = config('services.admin_notifications.email');

        if (! $adminEmail) {
            Log::info('Lead created email skipped: no admin notification email configured', [
                'lead_id' => $event->lead->id,
            ]);

            return;
        }

        $this->mail->send($adminEmail, new LeadCreatedMail($event->lead->loadMissing('assignee')));
    }
}
