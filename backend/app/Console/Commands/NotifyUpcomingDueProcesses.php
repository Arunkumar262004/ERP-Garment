<?php

namespace App\Console\Commands;

use App\Mail\SalesUpdateMail;
use App\Models\ProductionOrder;
use App\Models\ProductionProcess;
use App\Services\MailService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

/**
 * Due-date reminder: one day before a process's due date, if it's still not
 * completed, email the admin and the assigned employee so nothing slips
 * quietly past the deadline. Runs once daily; `due_reminder_sent_at` stops a
 * manual re-run (or a second cron tick) from emailing the same stage twice
 * for the same due date — it's cleared whenever the due date itself changes.
 */
#[Signature('app:notify-upcoming-due-processes')]
#[Description('Email the admin and assigned employee for processes due tomorrow that are not yet completed')]
class NotifyUpcomingDueProcesses extends Command
{
    public function __construct(protected MailService $mail)
    {
        parent::__construct();
    }

    public function handle(): void
    {
        $adminEmail = config('services.admin_notifications.email');
        $tomorrow = now()->addDay()->toDateString();

        $processes = ProductionProcess::query()
            ->whereDate('due_date', $tomorrow)
            ->whereNotIn('status', ['completed', 'skipped'])
            ->whereNull('due_reminder_sent_at')
            ->with(['productionOrder.contact', 'employee'])
            ->get();

        $sent = 0;

        foreach ($processes as $process) {
            $order = $process->productionOrder;

            if (! $order) {
                continue;
            }

            $stageLabel = ProductionOrder::STAGE_LABELS[$process->process_type] ?? $process->process_type;
            $employee = $process->employee;

            $subject = "Due tomorrow: {$stageLabel} on {$order->order_no}";
            $body = "{$stageLabel} on order {$order->order_no} ({$order->contact?->name}) is due tomorrow ({$process->due_date?->toDateString()}) and is still {$process->status}.".
                ($employee ? " Assigned to {$employee->name}." : ' No employee assigned yet.');

            if ($adminEmail && $this->mail->send($adminEmail, new SalesUpdateMail($subject, $body))) {
                $sent++;
            }

            if ($employee?->email && $this->mail->send($employee->email, new SalesUpdateMail($subject, $body))) {
                $sent++;
            }

            $process->update(['due_reminder_sent_at' => now()]);
        }

        $this->info("Checked {$processes->count()} process(es) due tomorrow, sent {$sent} email(s).");
    }
}
