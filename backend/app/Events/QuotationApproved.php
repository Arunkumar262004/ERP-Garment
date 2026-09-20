<?php

namespace App\Events;

use App\Models\Quotation;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired once a quotation's approval has been committed to the database.
 * Implementing ShouldDispatchAfterCommit means listeners only run after the
 * enclosing DB transaction commits, even when dispatched from inside one.
 */
class QuotationApproved implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public readonly Quotation $quotation) {}
}
