<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Equipment extends Model
{
    protected $table = 'equipment';
    protected $fillable = ['name', 'description', 'total_quantity', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];
    protected $appends = ['available_quantity'];

    public function stockLogs() { return $this->hasMany(EquipmentStockLog::class); }
    public function reservations() { return $this->hasMany(Reservation::class); }
    public function borrowings() { return $this->hasMany(Borrowing::class); }

    public function scopeWithBorrowedQty($query)
    {
        return $query->withSum(
            ['borrowings as out_quantity' => fn ($q) => $q->where('status', 'released')],
            'quantity'
        );
    }

    public function getAvailableQuantityAttribute()
    {
        $out = array_key_exists('out_quantity', $this->attributes)
            ? (int) $this->attributes['out_quantity']
            : (int) $this->borrowings()->where('status', 'released')->sum('quantity');

        return max(0, $this->total_quantity - $out);
    }
}   