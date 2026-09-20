<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'delivery_no', 'production_order_id', 'contact_id', 'delivery_date', 'delivery_address',
    'status', 'tracking_no', 'delivered_by', 'remarks', 'created_by',
])]
class Delivery extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'delivery_date' => 'date',
        ];
    }

    public function productionOrder(): BelongsTo
    {
        return $this->belongsTo(ProductionOrder::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }
}
