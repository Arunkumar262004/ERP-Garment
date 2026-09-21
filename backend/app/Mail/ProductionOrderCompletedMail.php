<?php

namespace App\Mail;

use App\Models\ProductionOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/**
 * Sent to both the admin and the customer once a production order's status
 * flips to "completed" — the same content works for either recipient, since
 * it's just an order-status confirmation.
 */
class ProductionOrderCompletedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public readonly ProductionOrder $order) {}

    public function build(): self
    {
        return $this
            ->subject("Order {$this->order->order_no} is complete")
            ->view('emails.production-order-completed');
    }
}
