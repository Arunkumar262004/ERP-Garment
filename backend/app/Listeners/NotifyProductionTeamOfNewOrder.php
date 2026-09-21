<?php

namespace App\Listeners;

use App\Events\ProductionOrderCreated;
use App\Models\User;
use App\Notifications\NewProductionOrderNotification;

class NotifyProductionTeamOfNewOrder
{
    public function handle(ProductionOrderCreated $event): void
    {
        $order = $event->order->loadMissing('contact');

        $productionUsers = User::where('role', 'production')
            ->where('is_active', true)
            ->get();

        foreach ($productionUsers as $user) {
            $user->notify(new NewProductionOrderNotification($order));
        }
    }
}
