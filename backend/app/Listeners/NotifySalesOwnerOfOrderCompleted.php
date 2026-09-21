<?php

namespace App\Listeners;

use App\Events\ProductionOrderCompleted;
use App\Listeners\Concerns\NotifiesSalesOwner;
use App\Services\WasenderService;

class NotifySalesOwnerOfOrderCompleted
{
    use NotifiesSalesOwner;

    public function __construct(protected WasenderService $wasender) {}

    public function handle(ProductionOrderCompleted $event): void
    {
        $order = $event->order->loadMissing('contact');

        $this->notifySalesOwner(
            $this->wasender,
            $order->contact,
            "Order {$order->order_no} complete",
            "Order {$order->order_no} for {$order->contact?->name} is now complete and ready for delivery."
        );
    }
}
