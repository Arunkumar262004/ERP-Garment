<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'production_order_id', 'item_name', 'description', 'quantity', 'unit',
    'sku', 'garment_type', 'gsm', 'cutting_weight_kg', 'size_id', 'color', 'hsn_code', 'details',
])]
class ProductionOrderItem extends Model
{
    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'cutting_weight_kg' => 'decimal:2',
        ];
    }

    public function productionOrder(): BelongsTo
    {
        return $this->belongsTo(ProductionOrder::class);
    }

    public function size(): BelongsTo
    {
        return $this->belongsTo(Size::class);
    }

    public function variant(): HasOne
    {
        return $this->hasOne(ProductVariant::class);
    }
}
