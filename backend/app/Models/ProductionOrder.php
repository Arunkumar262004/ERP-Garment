<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'order_no', 'contact_id', 'quotation_id', 'invoice_id', 'order_date', 'expected_delivery_date',
    'status', 'total_quantity', 'brand_id', 'order_type', 'notes', 'created_by',
])]
class ProductionOrder extends Model
{
    use HasFactory;

    /**
     * Mirrors the frontend's currentStageLabel() in ProductionOrdersPage.tsx
     * so the API and the UI table never disagree on what "current stage" means.
     */
    public const STAGE_LABELS = [
        'dyeing' => 'Dyeing',
        'printing' => 'Printing',
        'cutting' => 'Cutting',
        'stitching' => 'Stitching',
        'packing' => 'Packing',
        'quality_check' => 'Quality Check',
    ];

    protected function casts(): array
    {
        return [
            'order_date' => 'date',
            'expected_delivery_date' => 'date',
            'total_quantity' => 'decimal:2',
        ];
    }

    public function currentStageLabel(): string
    {
        if ($this->status === 'cancelled') {
            return 'Cancelled';
        }

        if ($this->status === 'delivered') {
            return 'Delivered';
        }

        $processes = $this->relationLoaded('processes') ? $this->processes : $this->processes()->get();

        if ($processes->isEmpty()) {
            return '—';
        }

        $active = $processes->first(fn (ProductionProcess $p) => ! in_array($p->status, ['completed', 'skipped'], true));

        if (! $active) {
            return 'Completed';
        }

        return self::STAGE_LABELS[$active->process_type] ?? $active->process_type;
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ProductionOrderItem::class);
    }

    public function materials(): HasMany
    {
        return $this->hasMany(ProductionOrderMaterial::class);
    }

    public function processes(): HasMany
    {
        return $this->hasMany(ProductionProcess::class)->orderBy('sequence');
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(Delivery::class);
    }
}
