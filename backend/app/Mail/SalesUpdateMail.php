<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/**
 * Generic short update email — the email twin of a WasenderService WhatsApp
 * text, used everywhere a sales owner or admin needs the same plain-text
 * update by both channels (new quotation/invoice/order, order completed,
 * process assignments, ...). Subject and body are supplied by the caller
 * rather than templated per event, since the content is already a single
 * short sentence with nothing else worth formatting.
 */
class SalesUpdateMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public readonly string $subjectLine, public readonly string $body) {}

    public function build(): self
    {
        return $this
            ->subject($this->subjectLine)
            ->view('emails.sales-update');
    }
}
