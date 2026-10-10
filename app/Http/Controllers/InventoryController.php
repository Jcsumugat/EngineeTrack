<?php

namespace App\Http\Controllers;

use App\Models\Equipment;
use App\Models\EquipmentStockLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $items = Equipment::query()
            ->withBorrowedQty()
            ->when($request->q, fn ($q, $s) => $q->where('name', 'like', '%' . addcslashes($s, '%_\\') . '%'))
            ->orderBy('name')->paginate(15)->withQueryString();

        return Inertia::render('Inventory/Index', [
            'items' => $items,
            'filters' => $request->only('q'),
        ]);
    }

    public function create()
    {
        return Inertia::render('Inventory/Create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:equipment,name',
            'description' => 'nullable|string',
            'total_quantity' => 'required|integer|min:0|max:100000',
        ]);

        DB::transaction(function () use ($data) {
            $e = Equipment::create($data);
            if ($e->total_quantity > 0) {
                EquipmentStockLog::create([
                    'equipment_id' => $e->id,
                    'change' => $e->total_quantity,
                    'reason' => 'Initial stock',
                    'created_by' => auth()->id(),
                ]);
            }
        });

        return redirect()->route('inventory.index')->with('success', 'Equipment added.');
    }

    public function show(Equipment $equipment)
    {
        $equipment->load(['stockLogs' => fn ($q) => $q->latest(), 'stockLogs.creator']);
        return Inertia::render('Inventory/Show', ['equipment' => $equipment]);
    }

    public function edit(Equipment $equipment)
    {
        return Inertia::render('Inventory/Edit', ['equipment' => $equipment]);
    }

    public function update(Request $request, Equipment $equipment)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('equipment', 'name')->ignore($equipment->id)],
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);
        $data['is_active'] = $request->boolean('is_active');
        $equipment->update($data);

        return redirect()->route('inventory.index')->with('success', 'Equipment updated.');
    }

    public function manageStock(Request $request, Equipment $equipment)
    {
        $data = $request->validate([
            'action' => ['required', Rule::in(['add', 'reduce'])],
            'quantity' => 'required|integer|min:1|max:100000',
            // A reason is mandatory when reducing, so every deduction can be audited
            'reason' => [Rule::requiredIf($request->input('action') === 'reduce'), 'nullable', 'string', 'max:255'],
        ], [
            'reason.required' => 'Please give a reason for reducing stock.',
        ]);

        $isAdd = $data['action'] === 'add';
        $quantity = (int) $data['quantity'];

        DB::transaction(function () use ($equipment, $data, $isAdd, $quantity) {
            // Lock the row so two admins cannot reduce the same stock at once
            $locked = Equipment::withBorrowedQty()
                ->whereKey($equipment->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (!$isAdd) {
                $available = (int) ($locked->available_quantity
                    ?? ((int) $locked->total_quantity - (int) $locked->out_quantity));

                if ($quantity > $available) {
                    throw ValidationException::withMessages([
                        'quantity' => "You can only reduce up to {$available} available unit(s). The rest are currently borrowed or reserved.",
                    ]);
                }
            }

            $change = $isAdd ? $quantity : -$quantity;

            Equipment::whereKey($equipment->id)->increment('total_quantity', $change);

            EquipmentStockLog::create([
                'equipment_id' => $equipment->id,
                'change' => $change,
                'reason' => $data['reason'] ?: ($isAdd ? 'Additional stock' : 'Stock reduction'),
                'created_by' => auth()->id(),
            ]);
        });

        return back()->with('success', $isAdd ? 'Stock added.' : 'Stock reduced.');
    }

    public function destroy(Equipment $equipment)
    {
        if ($equipment->borrowings()->exists() || $equipment->reservations()->exists()) {
            $equipment->update(['is_active' => false]);
            return back()->with('success', 'Equipment has history, so it was deactivated instead of deleted.');
        }

        $equipment->delete();
        return back()->with('success', 'Equipment deleted.');
    }
}