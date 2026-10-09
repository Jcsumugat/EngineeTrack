<?php

namespace App\Services;

use App\Models\Borrowing;
use App\Models\Equipment;
use App\Models\Facility;
use App\Models\Reservation;

class AvailabilityService
{
    // available = total - approved overlapping reservations - approved (not yet released) borrowings - released (unreturned) borrowings
    public function equipmentAvailable(
        Equipment $equipment,
        $from,
        $to,
        ?int $excludeReservationId = null,
        ?int $excludeBorrowingId = null
    ): int {
        $reserved = Reservation::where('equipment_id', $equipment->id)
            ->where('status', 'approved')
            ->where('date_from', '<', $to)
            ->where('date_to', '>', $from)
            ->when($excludeReservationId, fn ($q) => $q->where('id', '!=', $excludeReservationId))
            ->sum('quantity');

        $approvedBorrowings = Borrowing::where('equipment_id', $equipment->id)
            ->where('status', 'approved')
            ->where(fn ($q) => $q->whereNull('due_at')->orWhere('due_at', '>', $from))
            ->when($excludeBorrowingId, fn ($q) => $q->where('id', '!=', $excludeBorrowingId))
            ->sum('quantity');

        $out = Borrowing::where('equipment_id', $equipment->id)
            ->where('status', 'released')
            ->sum('quantity');

        return max(0, $equipment->total_quantity - $reserved - $approvedBorrowings - $out);
    }

    public function facilityAvailable(Facility $facility, $from, $to, ?int $excludeReservationId = null): bool
    {
        return !Reservation::where('facility_id', $facility->id)
            ->whereIn('status', ['approved', 'released'])
            ->where('date_from', '<', $to)
            ->where('date_to', '>', $from)
            ->when($excludeReservationId, fn ($q) => $q->where('id', '!=', $excludeReservationId))
            ->exists();
    }
}