<?php

namespace App\Events;

use App\Models\Quotation;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired once a new quotation has been committed to the database, so the
 * customer's sales owner can be kept in the loop.
 */
class QuotationCreated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public readonly Quotation $quotation) {}
}
