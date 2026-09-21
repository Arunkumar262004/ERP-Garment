<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'lead_no', 'contact_id', 'name', 'company_name', 'email', 'phone', 'source',
    'status', 'expected_value', 'expected_close_date', 'follow_up_date', 'assigned_to', 'notes', 'created_by',
])]
class Lead extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'expected_value' => 'decimal:2',
            'expected_close_date' => 'date',
            'follow_up_date' => 'date',
        ];
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(CrmTask::class);
    }

    public function quotations(): HasMany
    {
        return $this->hasMany(Quotation::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(LeadItem::class);
    }
}
