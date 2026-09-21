<?php

namespace App\Notifications;

use App\Models\ProductionOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewProductionOrderNotification extends Notification
{
    use Queueable;

    public function __construct(public ProductionOrder $order) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("New production order — {$this->order->order_no}")
            ->greeting("Hi {$notifiable->name},")
            ->line("A new production order {$this->order->order_no} for {$this->order->contact?->name} is ready to start.")
            ->line("Quantity: {$this->order->total_quantity}")
            ->action('View Order', url("/production/orders/{$this->order->id}/items"))
            ->line('You are receiving this because you are on the production team.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => "New order — {$this->order->order_no}",
            'message' => "Order {$this->order->order_no} for {$this->order->contact?->name} is ready for production.",
            'url' => "/production/orders/{$this->order->id}/items",
            'production_order_id' => $this->order->id,
        ];
    }
}
