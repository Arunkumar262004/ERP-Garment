<?php

namespace App\Mail;

use App\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class LeadCreatedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public readonly Lead $lead) {}

    public function build(): self
    {
        return $this
            ->subject("New lead — {$this->lead->lead_no}")
            ->view('emails.lead-created');
    }
}
