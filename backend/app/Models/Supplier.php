<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['code', 'name', 'contact_person', 'email', 'phone', 'address', 'gst_number', 'status'])]
class Supplier extends Model
{
    use HasFactory;

    public function rawMaterials(): HasMany
    {
        return $this->hasMany(RawMaterial::class, 'default_supplier_id');
    }

    public function purchaseOrders(): HasMany
    {
        return $this->hasMany(PurchaseOrder::class);
    }
}
