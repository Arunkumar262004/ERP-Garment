<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'type', 'code', 'name', 'company_name', 'email', 'phone', 'alternate_phone',
    'gst_number', 'pan_number', 'billing_address', 'shipping_address', 'city',
    'state', 'country', 'pincode', 'employee_code', 'designation', 'department',
    'category', 'date_of_joining', 'status', 'notes', 'created_by',
])]
class Contact extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'date_of_joining' => 'date',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    public function quotations(): HasMany
    {
        return $this->hasMany(Quotation::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function productionOrders(): HasMany
    {
        return $this->hasMany(ProductionOrder::class);
    }

    /**
     * The sales user who owns this customer — whoever the most recent lead
     * that converted into (or otherwise links to) this contact was assigned
     * to. Used to route WhatsApp/email updates about this customer's orders,
     * quotations and invoices back to the rep who's been working the lead.
     */
    public function salesOwner(): ?User
    {
        return $this->leads()->whereNotNull('assigned_to')->latest()->first()?->assignee;
    }
}
