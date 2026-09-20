<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['sku', 'name', 'category', 'unit', 'current_stock', 'reorder_level', 'unit_price', 'default_supplier_id'])]
class RawMaterial extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'current_stock' => 'decimal:2',
            'reorder_level' => 'decimal:2',
            'unit_price' => 'decimal:2',
        ];
    }

    public function defaultSupplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'default_supplier_id');
    }

    public function purchaseOrderItems(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }
}
