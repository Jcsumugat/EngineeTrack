<?php

namespace App\Http\Controllers;

use App\Models\Borrowing;
use App\Models\Department;
use App\Models\Equipment;
use App\Models\EquipmentStockLog;
use App\Models\User;
use App\Services\AvailabilityService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class BorrowingController extends Controller
{
    public function __construct(private AvailabilityService $availability) {}

    public function index()
    {
        $user = auth()->user();
        $borrowings = Borrowing::with(['user.department', 'department', 'equipment', 'reviewer', 'releaser', 'receiver'])
            ->when(!$user->isAdmin(), fn($q) => $q->where('user_id', $user->id))
            ->latest()->paginate(10);
        return Inertia::render('Borrowings/Index', ['borrowings' => $borrowings]);
    }

    public function create()
    {
        return Inertia::render('Borrowings/Create', [
            'equipment' => Equipment::withBorrowedQty()->where('is_active', 1)->orderBy('name')->get(),
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
            'equipment_id' => 'required|exists:equipment,id',
            'quantity' => 'required|integer|min:1',
            'due_at' => 'required|date|after:now',
            'purpose' => 'nullable|string|max:500',
        ];
        // Only admins may choose who the request is for.
        if ($user->isAdmin()) {
            $rules['user_id'] = ['required', Rule::exists('users', 'id')->where('role', 'faculty_staff')];
        }

        $data = $request->validate($rules);
        $ownerId = $user->isAdmin() ? $data['user_id'] : $user->id;
        unset($data['user_id']);

        $eq = Equipment::findOrFail($data['equipment_id']);
        if ($data['quantity'] > $this->availability->equipmentAvailable($eq, now(), $data['due_at'])) {
            return back()->withInput()->withErrors(['quantity' => 'Not enough available quantity.']);
        }

        Borrowing::create($data + ['user_id' => $ownerId, 'status' => 'pending']);
        return redirect()->route('borrowings.index')->with('success', 'Borrow request submitted.');
    }

    public function approve(Borrowing $borrowing)
    {
        abort_unless($borrowing->status === 'pending', 422);

        try {
            DB::transaction(function () use ($borrowing) {
                // Lock the equipment row so two approvals can't claim the same stock.
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

    // The borrower replaces damaged units with new ones: stock goes back up and the stock log records it.
    public function replace(Request $request, Borrowing $borrowing)
    {
        $data = $request->validate([
            'replaced_quantity' => 'required|integer|min:1',
            'replacement_note' => 'nullable|string|max:200',
        ]);

        DB::transaction(function () use ($borrowing, $data) {
            // Lock the row so two admins cannot replace the same units twice.
            $b = Borrowing::whereKey($borrowing->id)->lockForUpdate()->firstOrFail();

            abort_unless($b->status === 'returned' && $b->damaged_quantity > 0, 422);

            $outstanding = $b->damaged_quantity - $b->replaced_quantity;
            $qty = (int) $data['replaced_quantity'];

            if ($qty > $outstanding) {
                throw ValidationException::withMessages([
                    'replaced_quantity' => $outstanding > 0
                        ? "Only {$outstanding} damaged unit(s) are still waiting for a replacement."
                        : 'All damaged units have already been replaced.',
                ]);
            }

            $b->update([
                'replaced_quantity' => $b->replaced_quantity + $qty,
                'replaced_at' => now(),
                'replacement_note' => $data['replacement_note'] ?? $b->replacement_note,
            ]);

            $b->equipment->increment('total_quantity', $qty);

            $reason = 'Replacement for damaged items (borrowing #' . $b->id . ')';
            if (!empty($data['replacement_note'])) {
                $reason .= ' - ' . $data['replacement_note'];
            }

            EquipmentStockLog::create([
                'equipment_id' => $b->equipment_id,
                'change' => $qty,
                'reason' => Str::limit($reason, 250, ''),
                'created_by' => auth()->id(),
            ]);
        });

        return back()->with('success', 'Replacement recorded and added to stock.');
    }
}