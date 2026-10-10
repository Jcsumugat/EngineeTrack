<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Borrowing extends Model
{
    protected $fillable = [
        'user_id', 'department_id', 'reservation_id', 'equipment_id', 'quantity', 'purpose', 'borrowed_at', 'due_at',
        'status', 'reviewed_by', 'reviewed_at', 'released_by', 'released_at', 'returned_at',
        'received_by', 'is_damaged', 'damaged_quantity', 'damage_note',
        'replaced_quantity', 'replaced_at', 'replacement_note',
    ];
    protected $casts = [
        'borrowed_at' => 'datetime', 'due_at' => 'datetime', 'reviewed_at' => 'datetime',
        'released_at' => 'datetime', 'returned_at' => 'datetime', 'replaced_at' => 'datetime',
        'is_damaged' => 'boolean',
    ];

    public function user() { return $this->belongsTo(User::class); }
    public function department() { return $this->belongsTo(Department::class); }
    public function equipment() { return $this->belongsTo(Equipment::class); }
    public function reservation() { return $this->belongsTo(Reservation::class); }
    public function reviewer() { return $this->belongsTo(User::class, 'reviewed_by'); }
    public function releaser() { return $this->belongsTo(User::class, 'released_by'); }
    public function receiver() { return $this->belongsTo(User::class, 'received_by'); }
}