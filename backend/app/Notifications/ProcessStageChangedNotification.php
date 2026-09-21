<?php

namespace App\Notifications;

use App\Models\ProductionOrder;
use App\Models\ProductionProcess;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProcessStageChangedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public ProductionProcess $process,
        public string $fromStatus,
        public string $toStatus,
    ) {}

    protected function stageLabel(): string
    {
        return ProductionOrder::STAGE_LABELS[$this->process->process_type] ?? $this->process->process_type;
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $order = $this->process->productionOrder;

        return (new MailMessage)
            ->subject("{$order->order_no} — {$this->stageLabel()} is now {$this->toStatus}")
            ->greeting("Hi {$notifiable->name},")
            ->line("The {$this->stageLabel()} stage on order {$order->order_no} moved from \"{$this->fromStatus}\" to \"{$this->toStatus}\".")
            ->line("Customer: {$order->contact?->name}")
            ->action('View Process', url("/production/orders/{$order->id}/processes/{$this->process->id}/edit"))
            ->line('You are receiving this because you are assigned to this stage.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $order = $this->process->productionOrder;

        return [
            'title' => "{$this->stageLabel()} → {$this->toStatus}",
            'message' => "Order {$order->order_no} ({$order->contact?->name}): {$this->stageLabel()} moved from \"{$this->fromStatus}\" to \"{$this->toStatus}\".",
            'url' => "/production/orders/{$order->id}/processes/{$this->process->id}/edit",
            'production_order_id' => $order->id,
            'production_process_id' => $this->process->id,
        ];
    }
}
