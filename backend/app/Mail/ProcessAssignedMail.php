<?php

namespace App\Mail;

use App\Models\ProductionProcess;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ProcessAssignedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public readonly ProductionProcess $process) {}

    public function build(): self
    {
        $order = $this->process->productionOrder;

        return $this
            ->subject("You've been assigned to {$order->order_no}")
            ->view('emails.process-assigned');
    }
}
