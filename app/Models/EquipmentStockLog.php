<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EquipmentStockLog extends Model
{
    protected $fillable = ['equipment_id', 'change', 'reason', 'created_by'];
    public function equipment() { return $this->belongsTo(Equipment::class); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
}