<?php

namespace App\Http\Controllers;

use App\Models\Borrowing;
use App\Models\Reservation;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CalendarController extends Controller
{
    public function index()
    {
        return Inertia::render('Calendar/Index');
    }

    public function events(Request $request)
    {
        $user = auth()->user();
        $tz = config('app.timezone');
        $start = $request->query('start') ? Carbon::parse($request->query('start'))->setTimezone($tz) : null;
        $end = $request->query('end') ? Carbon::parse($request->query('end'))->setTimezone($tz) : null;

        $reservations = Reservation::with(['user', 'department', 'equipment', 'facility'])
            ->whereIn('status', ['approved', 'released'])
            ->when(!$user->isAdmin(), fn($q) => $q->where('user_id', $user->id))
            ->when($start && $end, fn($q) => $q->where('date_from', '<', $end)->where('date_to', '>=', $start))
            ->get()
            ->map(function ($r) {
                $item = $r->equipment?->name ?? $r->facility?->name;
                return [
                    'id' => 'r' . $r->id,
                    'title' => 'Reserved: ' . $item,
                    'start' => $r->date_from->toIso8601String(),
                    'end' => $r->date_to->toIso8601String(),
                    'color' => '#2563eb',
                    'extendedProps' => [
                        'type' => 'reservation',
                        'kind' => $r->equipment_id ? 'Equipment' : 'Facility',
                        'item' => $item,
                        'quantity' => $r->quantity,
                        'requester' => $r->user?->name,
                        'department' => $r->department?->name ?? $r->user?->department?->name,
                        'status' => $r->status,
                        'purpose' => $r->purpose,
                        'from' => $r->date_from->toIso8601String(),
                        'to' => $r->date_to->toIso8601String(),
                    ],
                ];
            });

        // Borrowings created by releasing a reservation are skipped: the reservation already shows.
        $borrowings = Borrowing::with(['user', 'department', 'equipment'])
            ->whereIn('status', ['approved', 'released'])
            ->whereNull('reservation_id')
            ->when(!$user->isAdmin(), fn($q) => $q->where('user_id', $user->id))
            ->get()
            ->map(function ($b) {
                $from = $b->borrowed_at ?? $b->created_at;
                $to = $b->due_at ?? $from;
                return [
                    'id' => 'b' . $b->id,
                    'title' => 'Borrowed: ' . $b->equipment?->name,
                    'start' => $from->toIso8601String(),
                    'end' => $to->toIso8601String(),
                    'color' => '#16a34a',
                    'extendedProps' => [
                        'type' => 'borrowing',
                        'kind' => 'Equipment',
                        'item' => $b->equipment?->name,
                        'quantity' => $b->quantity,
                        'requester' => $b->user?->name,
                        'department' => $b->department?->name ?? $b->user?->department?->name,
                        'status' => $b->status,
                        'purpose' => $b->purpose,
                        'from' => $from->toIso8601String(),
                        'to' => $to->toIso8601String(),
                    ],
                ];
            });

        return response()->json($reservations->concat($borrowings)->values());
    }
}