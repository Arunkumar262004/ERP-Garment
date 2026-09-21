<?php

namespace App\Listeners;

use App\Events\InvoiceCreated;
use App\Listeners\Concerns\NotifiesSalesOwner;
use App\Services\WasenderService;

class NotifySalesOwnerOfInvoice
{
    use NotifiesSalesOwner;

    public function __construct(protected WasenderService $wasender) {}

    public function handle(InvoiceCreated $event): void
    {
        $invoice = $event->invoice->loadMissing('contact');

        $this->notifySalesOwner(
            $this->wasender,
            $invoice->contact,
            "New invoice {$invoice->invoice_no}",
            "Invoice {$invoice->invoice_no} was created for {$invoice->contact?->name} — total \u{20B9}".number_format((float) $invoice->total, 2).'.'
        );
    }
}
