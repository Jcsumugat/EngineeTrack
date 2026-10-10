<?php

namespace App\Http\Controllers;

use App\Models\Borrowing;
use App\Models\Department;
use App\Models\Equipment;
use App\Models\Facility;
use App\Models\Reservation;
use App\Models\User;
use App\Services\AvailabilityService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ReservationController extends Controller
{
    public function __construct(private AvailabilityService $availability) {}

    public function index()
    {
        $user = auth()->user();
        $reservations = Reservation::with(['user.department', 'department', 'equipment', 'facility'])
            ->when(!$user->isAdmin(), fn($q) => $q->where('user_id', $user->id))
            ->latest()->paginate(10);
        return Inertia::render('Reservations/Index', ['reservations' => $reservations]);
    }

    public function create()
    {
        return Inertia::render('Reservations/Create', [
            'equipment' => Equipment::withBorrowedQty()->where('is_active', 1)->orderBy('name')->get(),
            'facilities' => Facility::where('is_active', 1)->orderBy('name')->get(),
            'departments' => Department::orderBy('name')->get(['id', 'name']),
            'users' => auth()->user()->isAdmin()
                ? User::where('role', 'faculty_staff')->orderBy('name')->get(['id', 'name', 'department_id'])
                : [],
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        $rules = [
            'department_id' => 'required|exists:departments,id',
            'type' => 'required|in:equipment,facility',
            'equipment_id' => 'required_if:type,equipment|nullable|exists:equipment,id',
            'facility_id' => 'required_if:type,facility|nullable|exists:facilities,id',
            'quantity' => 'nullable|integer|min:1',
            'date_from' => 'required|date|after_or_equal:now',
            'date_to' => 'required|date|after_or_equal:date_from',
            'purpose' => 'nullable|string|max:500',
        ];
        // Only admins may choose who the reservation is for.
        if ($user->isAdmin()) {
            $rules['user_id'] = ['required', Rule::exists('users', 'id')->where('role', 'faculty_staff')];
        }

        $data = $request->validate($rules);
        $ownerId = $user->isAdmin() ? $data['user_id'] : $user->id;

        if ($data['type'] === 'equipment') {
            $eq = Equipment::findOrFail($data['equipment_id']);
            $qty = $data['quantity'] ?? 1;
            if ($qty > $this->availability->equipmentAvailable($eq, $data['date_from'], $data['date_to'])) {
                return back()->withInput()->withErrors(['quantity' => 'Not enough available quantity for those dates.']);
            }
            $payload = ['equipment_id' => $eq->id, 'facility_id' => null, 'quantity' => $qty];
        } else {
            $fa = Facility::findOrFail($data['facility_id']);
            if (!$this->availability->facilityAvailable($fa, $data['date_from'], $data['date_to'])) {
                return back()->withInput()->withErrors(['facility_id' => 'Facility is already booked for those dates.']);
            }
            $payload = ['facility_id' => $fa->id, 'equipment_id' => null, 'quantity' => 1];
        }

        Reservation::create($payload + [
            'user_id' => $ownerId,
            'department_id' => $data['department_id'],
            'date_from' => $data['date_from'],
            'date_to' => $data['date_to'],
            'purpose' => $data['purpose'] ?? null,
            'status' => 'pending',
        ]);
        return redirect()->route('reservations.index')->with('success', 'Reservation submitted.');
    }

    public function approve(Reservation $reservation)
    {
        abort_unless($reservation->status === 'pending', 422);
        if ($reservation->equipment_id) {
            $avail = $this->availability->equipmentAvailable($reservation->equipment, $reservation->date_from, $reservation->date_to, $reservation->id);
            if ($reservation->quantity > $avail) return back()->with('error', 'Not enough available quantity.');
        } elseif (!$this->availability->facilityAvailable($reservation->facility, $reservation->date_from, $reservation->date_to, $reservation->id)) {
            return back()->with('error', 'Facility is already booked for those dates.');
        }
        $reservation->update(['status' => 'approved', 'reviewed_by' => auth()->id(), 'reviewed_at' => now()]);
        return back()->with('success', 'Reservation approved.');
    }

    public function disapprove(Request $request, Reservation $reservation)
    {
        abort_unless($reservation->status === 'pending', 422);
        $reservation->update([
            'status' => 'disapproved',
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
            'remarks' => $request->input('remarks'),
        ]);
        return back()->with('success', 'Reservation disapproved.');
    }

    // Release on the date of use. Equipment: creates a released borrowing (this is when stock is "deducted").
    public function release(Reservation $reservation)
    {
        abort_unless($reservation->status === 'approved', 422);

        try {
            DB::transaction(function () use ($reservation) {
                if ($reservation->equipment_id) {
                    // Lock the equipment row, then check availability (excluding this reservation itself).
                    $equipment = Equipment::lockForUpdate()->findOrFail($reservation->equipment_id);

                    $avail = $this->availability->equipmentAvailable(
                        $equipment, $reservation->date_from, $reservation->date_to, $reservation->id
                    );

                    if ($reservation->quantity > $avail) {
                        throw ValidationException::withMessages([
                            'quantity' => 'Not enough available quantity to release.',
                        ]);
                    }

                    Borrowing::create([
                        'user_id' => $reservation->user_id,
                        'department_id' => $reservation->department_id,
                        'reservation_id' => $reservation->id,
                        'equipment_id' => $reservation->equipment_id,
                        'quantity' => $reservation->quantity,
                        'purpose' => $reservation->purpose,
                        'borrowed_at' => now(),
                        'due_at' => $reservation->date_to,
                        'status' => 'released',
                        'reviewed_by' => $reservation->reviewed_by,
                        'reviewed_at' => $reservation->reviewed_at,
                        'released_by' => auth()->id(),
                        'released_at' => now(),
                    ]);
                }
                $reservation->update(['status' => 'released']);
            });
        } catch (ValidationException $e) {
            return back()->with('error', $e->errors()['quantity'][0] ?? 'Cannot release.');
        }

        return back()->with('success', 'Reservation released.');
    }

    public function complete(Reservation $reservation)
    {
        abort_unless($reservation->status === 'released' && $reservation->facility_id, 422);
        $reservation->update(['status' => 'completed']);
        return back()->with('success', 'Reservation completed.');
    }

    public function cancel(Reservation $reservation)
    {
        $user = auth()->user();
        abort_unless($user->isAdmin() || $reservation->user_id === $user->id, 403);
        abort_unless(in_array($reservation->status, ['pending', 'approved']), 422);
        $reservation->update(['status' => 'cancelled']);
        return back()->with('success', 'Reservation cancelled.');
    }
}