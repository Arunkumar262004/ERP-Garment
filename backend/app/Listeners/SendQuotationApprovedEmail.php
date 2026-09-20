<?php

namespace App\Listeners;

use App\Events\QuotationApproved;
use App\Mail\QuotationApprovedMail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendQuotationApprovedEmail
{
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

        Mail::to($email)->send(new QuotationApprovedMail($quotation));
    }
}
