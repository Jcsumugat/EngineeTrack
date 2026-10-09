<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    protected $fillable = [
        'user_id', 'department_id', 'equipment_id', 'facility_id', 'quantity', 'date_from', 'date_to',
        'purpose', 'status', 'reviewed_by', 'reviewed_at', 'remarks',
    ];
    protected $casts = ['date_from' => 'datetime', 'date_to' => 'datetime', 'reviewed_at' => 'datetime'];

    public function user() { return $this->belongsTo(User::class); }
    public function equipment() { return $this->belongsTo(Equipment::class); }
    public function facility() { return $this->belongsTo(Facility::class); }
    public function reviewer() { return $this->belongsTo(User::class, 'reviewed_by'); }
    public function borrowing() { return $this->hasOne(Borrowing::class); }
    public function department()
{
    return $this->belongsTo(Department::class);
}
}