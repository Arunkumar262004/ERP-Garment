<?php

namespace App\Listeners;

use App\Events\QuotationApproved;
use App\Jobs\SendN8nWebhook;

class SendQuotationApprovedWebhook
{
    public function handle(QuotationApproved $event): void
    {
        $quotation = $event->quotation->loadMissing('contact');

        SendN8nWebhook::dispatch([
            'event' => 'quotation.approved',
            'event_id' => $quotation->approval_event_id,
            'quotation_id' => $quotation->id,
            'customer_name' => $quotation->contact?->name,
            'total_amount' => (float) $quotation->total,
            'status' => $quotation->status,
        ], config('services.n8n.quotation_webhook_url'));
    }
}
