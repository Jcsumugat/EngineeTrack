<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Facility extends Model
{
    protected $fillable = ['name', 'description', 'capacity', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];
    public function reservations() { return $this->hasMany(Reservation::class); }
}