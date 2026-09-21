<?php

namespace App\Events;

use App\Models\ProductionOrder;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired the moment a production order's status flips to "completed" — either
 * because every process finished/was skipped, or the Delivery Challan stage
 * was marked delivered. Fires once per order (callers check the previous
 * status before dispatching), never on repeat saves once already completed.
 */
class ProductionOrderCompleted implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public readonly ProductionOrder $order) {}
}
