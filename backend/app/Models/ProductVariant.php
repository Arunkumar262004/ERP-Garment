<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['product_id', 'size_id', 'color', 'sku', 'stock_quantity', 'price', 'cost_price', 'production_order_item_id'])]
class ProductVariant extends Model
{
    protected function casts(): array
    {
        return [
            'stock_quantity' => 'decimal:2',
            'price' => 'decimal:2',
            'cost_price' => 'decimal:2',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function size(): BelongsTo
    {
        return $this->belongsTo(Size::class);
    }

    public function sourceItem(): BelongsTo
    {
        return $this->belongsTo(ProductionOrderItem::class, 'production_order_item_id');
    }

    public function invoiceItems(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }
}
