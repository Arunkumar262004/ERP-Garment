<?php

namespace App\Events;

use App\Models\ProductionOrder;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired once a new production order has been committed to the database, so
 * the production team can be notified there's new work to start.
 */
class ProductionOrderCreated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public readonly ProductionOrder $order) {}
}
