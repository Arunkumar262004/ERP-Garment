<?php

namespace App\Listeners;

use App\Events\ProductionOrderCompleted;
use App\Mail\ProductionOrderCompletedMail;
use App\Services\MailService;
use Illuminate\Support\Facades\Log;

/**
 * Notifies both the admin and the customer once a production order's status
 * flips to "completed" — the same "order is done" confirmation, to whoever
 * has an email on file. A missing customer email is logged and skipped, same
 * as the quotation-approved email flow; the admin email always goes out if
 * configured.
 */
class SendOrderCompletedEmails
{
    public function __construct(protected MailService $mail) {}

    public function handle(ProductionOrderCompleted $event): void
    {
        $order = $event->order->loadMissing('contact');
        $adminEmail = config('services.admin_notifications.email');
        $customerEmail = $order->contact?->email;

        if ($adminEmail) {
            $this->mail->send($adminEmail, new ProductionOrderCompletedMail($order));
        } else {
            Log::info('Order completed admin email skipped: no admin notification email configured', [
                'production_order_id' => $order->id,
            ]);
        }

        if ($customerEmail) {
            $this->mail->send($customerEmail, new ProductionOrderCompletedMail($order));
        } else {
            Log::info('Order completed customer email skipped: contact has no email on file', [
                'production_order_id' => $order->id,
            ]);
        }
    }
}
