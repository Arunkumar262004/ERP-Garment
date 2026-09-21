<?php

namespace App\Listeners;

use App\Events\QuotationCreated;
use App\Listeners\Concerns\NotifiesSalesOwner;
use App\Services\WasenderService;

class NotifySalesOwnerOfQuotation
{
    use NotifiesSalesOwner;

    public function __construct(protected WasenderService $wasender) {}

    public function handle(QuotationCreated $event): void
    {
        $quotation = $event->quotation->loadMissing('contact');

        $this->notifySalesOwner(
            $this->wasender,
            $quotation->contact,
            "New quotation {$quotation->quotation_no}",
            "Quotation {$quotation->quotation_no} was created for {$quotation->contact?->name} — total \u{20B9}".number_format((float) $quotation->total, 2).'.'
        );
    }
}
