<?php

namespace App\Events;

use App\Models\Invoice;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired once a new invoice has been committed to the database, so the
 * customer's sales owner can be kept in the loop.
 */
class InvoiceCreated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public readonly Invoice $invoice) {}
}
