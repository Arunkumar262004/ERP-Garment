<?php

namespace App\Listeners;

use App\Events\ProductionOrderCreated;
use App\Listeners\Concerns\NotifiesSalesOwner;
use App\Services\WasenderService;

class NotifySalesOwnerOfNewOrder
{
    use NotifiesSalesOwner;

    public function __construct(protected WasenderService $wasender) {}

    public function handle(ProductionOrderCreated $event): void
    {
        $order = $event->order->loadMissing('contact');

        $this->notifySalesOwner(
            $this->wasender,
            $order->contact,
            "New production order {$order->order_no}",
            "Production order {$order->order_no} was created for {$order->contact?->name} — quantity {$order->total_quantity}. Production has started."
        );
    }
}
