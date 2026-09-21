<?php

namespace App\Events;

use App\Models\Lead;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired once a new lead has been committed to the database, from any intake
 * path — the internal CRM form, quick capture, or the public inquiry form.
 */
class LeadCreated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public readonly Lead $lead) {}
}
