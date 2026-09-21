<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['lead_id', 'product_id', 'description', 'quantity', 'unit', 'target_price', 'delivery_date', 'notes'])]
class LeadItem extends Model
{
    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'target_price' => 'decimal:2',
            'delivery_date' => 'date',
        ];
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
