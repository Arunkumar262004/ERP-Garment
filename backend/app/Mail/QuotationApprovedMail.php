<?php

namespace App\Mail;

use App\Models\Quotation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class QuotationApprovedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public readonly Quotation $quotation) {}

    public function build(): self
    {
        return $this
            ->subject("Quotation {$this->quotation->quotation_no} approved")
            ->view('emails.quotation-approved');
    }
}
