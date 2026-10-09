<?php

namespace App\Http\Controllers;

use App\Models\Borrowing;
use App\Models\Department;
use App\Models\Equipment;
use App\Models\EquipmentStockLog;
use App\Services\AvailabilityService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class BorrowingController extends Controller
{
    public function __construct(private AvailabilityService $availability) {}

    public function index()
    {
        $user = auth()->user();
        $borrowings = Borrowing::with(['user.department', 'department', 'equipment'])
            ->when(!$user->isAdmin(), fn($q) => $q->where('user_id', $user->id))
            ->latest()->paginate(10);
        return Inertia::render('Borrowings/Index', ['borrowings' => $borrowings]);
    }

    public function create()
    {
        return Inertia::render('Borrowings/Create', [
            'equipment' => Equipment::withBorrowedQty()->where('is_active', 1)->orderBy('name')->get(),
            'departments' => Department::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'department_id' => 'required|exists:departments,id',
            'equipment_id' => 'required|exists:equipment,id',
            'quantity' => 'required|integer|min:1',
            'due_at' => 'required|date|after:now',
            'purpose' => 'nullable|string|max:500',
        ]);
        $eq = Equipment::findOrFail($data['equipment_id']);
        if ($data['quantity'] > $this->availability->equipmentAvailable($eq, now(), $data['due_at'])) {
            return back()->withInput()->withErrors(['quantity' => 'Not enough available quantity.']);
        }
        Borrowing::create($data + ['user_id' => auth()->id(), 'status' => 'pending']);
        return redirect()->route('borrowings.index')->with('success', 'Borrow request submitted.');
    }

    public function approve(Borrowing $borrowing)
    {
        abort_unless($borrowing->status === 'pending', 422);

        try {
            DB::transaction(function () use ($borrowing) {
                // Lock the equipment row so two approvals can't both claim the same stock.
                $equipment = Equipment::lockForUpdate()->findOrFail($borrowing->equipment_id);

                $avail = $this->availability->equipmentAvailable(
                    $equipment, now(), $borrowing->due_at ?? now()->addDay(), null, $borrowing->id
                );

                if ($borrowing->quantity > $avail) {
                    throw ValidationException::withMessages([
                        'quantity' => 'Not enough available quantity to approve.',
                    ]);
                }

                $borrowing->update([
                    'status' => 'approved',
                    'reviewed_by' => auth()->id(),
                    'reviewed_at' => now(),
                ]);
            });
        } catch (ValidationException $e) {
            return back()->with('error', $e->errors()['quantity'][0] ?? 'Cannot approve.');
        }

        return back()->with('success', 'Borrowing approved.');
    }

    public function disapprove(Borrowing $borrowing)
    {
        abort_unless($borrowing->status === 'pending', 422);
        $borrowing->update(['status' => 'disapproved', 'reviewed_by' => auth()->id(), 'reviewed_at' => now()]);
        return back()->with('success', 'Borrowing disapproved.');
    }

    public function release(Borrowing $borrowing)
    {
        abort_unless($borrowing->status === 'approved', 422);

        try {
            DB::transaction(function () use ($borrowing) {
                // Lock the equipment row so two admins can't release at the same time.
                $equipment = Equipment::lockForUpdate()->findOrFail($borrowing->equipment_id);

                // Exclude this borrowing itself, since it is currently "approved" and would block itself.
                $avail = $this->availability->equipmentAvailable(
                    $equipment, now(), $borrowing->due_at ?? now()->addDay(), null, $borrowing->id
                );

                if ($borrowing->quantity > $avail) {
                    throw ValidationException::withMessages([
                        'quantity' => 'Not enough available quantity to release.',
                    ]);
                }

                $borrowing->update([
                    'status' => 'released',
                    'borrowed_at' => now(),
                    'released_by' => auth()->id(),
                    'released_at' => now(),
                ]);
            });
        } catch (ValidationException $e) {
            return back()->with('error', $e->errors()['quantity'][0] ?? 'Cannot release.');
        }

        return back()->with('success', 'Equipment released.');
    }

    public function return(Request $request, Borrowing $borrowing)
    {
        abort_unless($borrowing->status === 'released', 422);
        $data = $request->validate([
            'is_damaged' => 'nullable|boolean',
            'damaged_quantity' => 'nullable|integer|min:0|max:' . $borrowing->quantity,
            'damage_note' => 'nullable|string|max:500',
        ]);
        $damaged = $request->boolean('is_damaged') ? (int) ($data['damaged_quantity'] ?? 0) : 0;

        DB::transaction(function () use ($borrowing, $data, $damaged) {
            $borrowing->update([
                'status' => 'returned',
                'returned_at' => now(),
                'received_by' => auth()->id(),
                'is_damaged' => $damaged > 0,
                'damaged_quantity' => $damaged,
                'damage_note' => $damaged > 0 ? ($data['damage_note'] ?? null) : null,
            ]);

            if ($damaged > 0) {
                $equipment = Equipment::lockForUpdate()->findOrFail($borrowing->equipment_id);
                $equipment->decrement('total_quantity', min($damaged, $equipment->total_quantity));
                EquipmentStockLog::create([
                    'equipment_id' => $equipment->id,
                    'change' => -$damaged,
                    'reason' => 'Damaged on return (borrowing #' . $borrowing->id . ')',
                    'created_by' => auth()->id(),
                ]);
            }

            if ($borrowing->reservation_id) {
                $borrowing->reservation()->update(['status' => 'completed']);
            }
        });
        return back()->with('success', 'Return recorded.');
    }
}