<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable([
    'production_order_id', 'process_type', 'sequence', 'status', 'assigned_to', 'assigned_employee_id',
    'quantity_completed', 'start_date', 'end_date', 'due_date', 'due_reminder_sent_at', 'remarks',
])]
class ProductionProcess extends Model
{
    /**
     * Canonical pipeline stage order — the single source of truth for both
     * controllers' validation rules (`ProductionOrderController`,
     * `ProductionProcessController`). `other` stays last as the catch-all.
     *
     * There is deliberately no "dc" (delivery challan) stage here — that
     * turned out to mean job-work paperwork, which was tried and removed —
     * production tracking here is driven purely by each process's own
     * status/quantity fields.
     */
    public const PROCESS_TYPES = [
        'knitting', 'dyeing', 'compacting', 'printing', 'cutting', 'stitching', 'packing', 'quality_check', 'other',
    ];

    protected function casts(): array
    {
        return [
            'quantity_completed' => 'decimal:2',
            'start_date' => 'date',
            'end_date' => 'date',
            'due_date' => 'date',
            'due_reminder_sent_at' => 'datetime',
        ];
    }

    public function productionOrder(): BelongsTo
    {
        return $this->belongsTo(ProductionOrder::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * The shop-floor employee (Contact, type=employee) doing this stage's
     * work — distinct from `assignee`, which is a system login/user.
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'assigned_employee_id');
    }

    /**
     * Order items that have been pulled into this specific process stage's
     * checklist. Items added to the order after the process already existed
     * are NOT attached automatically — they show up as "missed" until
     * explicitly imported, so staff notice line items added late.
     */
    public function items(): BelongsToMany
    {
        return $this->belongsToMany(ProductionOrderItem::class, 'production_process_items')
            ->withPivot('imported_at')
            ->withTimestamps();
    }
}
