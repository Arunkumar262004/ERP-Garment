<?php

namespace App\Listeners;

use App\Events\QuotationApproved;
use App\Mail\QuotationApprovedMail;
use App\Services\MailService;
use Illuminate\Support\Facades\Log;

class SendQuotationApprovedEmail
{
    public function __construct(protected MailService $mail) {}

    public function handle(QuotationApproved $event): void
    {
        $quotation = $event->quotation->loadMissing('contact');
        $email = $quotation->contact?->email;

        if (! $email) {
            Log::info('Quotation approved email skipped: contact has no email on file', [
                'quotation_id' => $quotation->id,
            ]);

            return;
        }

        $this->mail->send($email, new QuotationApprovedMail($quotation));
    }
}
