<?php

namespace App\Http\Controllers;

use App\Models\Borrowing;
use App\Models\Department;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportController extends Controller
{
    private function filters(Request $request): array
    {
        $month = (int) $request->input('month', now()->month);
        $year = (int) $request->input('year', now()->year);
        $focus = (string) $request->input('focus', 'all');

        if ($month < 1 || $month > 12) $month = now()->month;
        if ($year < 2020 || $year > 2100) $year = now()->year;
        if (!in_array($focus, ['all', 'equipment', 'venue'], true)) $focus = 'all';

        return ['month' => $month, 'year' => $year, 'focus' => $focus];
    }

    // Builds one combined list of reservations and walk-in borrowings for the selected month.
    private function monthlyRows(array $f)
    {
        $rows = collect();

        $reservations = Reservation::with(['user.department', 'department', 'equipment', 'facility', 'borrowing'])
            ->whereIn('status', ['approved', 'released', 'completed'])
            ->whereYear('date_from', $f['year'])
            ->whereMonth('date_from', $f['month'])
            ->when($f['focus'] === 'equipment', fn($q) => $q->whereNotNull('equipment_id'))
            ->when($f['focus'] === 'venue', fn($q) => $q->whereNotNull('facility_id'))
            ->get();

        foreach ($reservations as $r) {
            // Damage is recorded on the borrowing that was created when the reservation was released.
            $b = $r->borrowing;

            $rows->push([
                'key' => 'r' . $r->id,
                'request_code' => 'RES-' . str_pad($r->id, 4, '0', STR_PAD_LEFT),
                'event_title' => $r->purpose,
                'requester_name' => $r->user?->name,
                'department' => $r->department?->name ?? $r->user?->department?->name ?? '-',
                'resource_name' => $r->equipment?->name ?? $r->facility?->name,
                'item_type' => $r->equipment_id ? 'equipment' : 'venue',
                'quantity' => (int) $r->quantity,
                'start' => $r->date_from->format('M d, Y'),
                'end' => $r->date_to->format('M d, Y'),
                'status' => $r->status,
                'damaged_quantity' => (int) ($b?->damaged_quantity ?? 0),
                'damage_note' => $b?->damage_note,
                'returned_at' => $b?->returned_at?->format('M d, Y g:i A'),
                'sort' => $r->date_from->timestamp,
            ]);
        }

        if ($f['focus'] !== 'venue') {
            $borrowings = Borrowing::with(['user.department', 'department', 'equipment'])
                ->whereNull('reservation_id')
                ->whereIn('status', ['released', 'returned'])
                ->whereYear('borrowed_at', $f['year'])
                ->whereMonth('borrowed_at', $f['month'])
                ->get();

            foreach ($borrowings as $b) {
                $start = $b->borrowed_at ?? $b->created_at;
                $end = $b->due_at ?? $start;
                $rows->push([
                    'key' => 'b' . $b->id,
                    'request_code' => 'BOR-' . str_pad($b->id, 4, '0', STR_PAD_LEFT),
                    'event_title' => $b->purpose,
                    'requester_name' => $b->user?->name,
                    'department' => $b->department?->name ?? $b->user?->department?->name ?? '-',
                    'resource_name' => $b->equipment?->name,
                    'item_type' => 'equipment',
                    'quantity' => (int) $b->quantity,
                    'start' => $start->format('M d, Y'),
                    'end' => $end->format('M d, Y'),
                    'status' => $b->status,
                    'damaged_quantity' => (int) ($b->damaged_quantity ?? 0),
                    'damage_note' => $b->damage_note,
                    'returned_at' => $b->returned_at?->format('M d, Y g:i A'),
                    'sort' => $start->timestamp,
                ]);
            }
        }

        return $rows->sortByDesc('sort')->values();
    }

    public function borrowed(Request $request)
    {
        $f = $this->filters($request);
        $rows = $this->monthlyRows($f);
        $equipmentRows = $rows->where('item_type', 'equipment');

        $equipmentSummary = $equipmentRows->groupBy('resource_name')
            ->map(fn($g, $name) => [
                'resource_name' => $name,
                'total_quantity' => $g->sum('quantity'),
                'request_count' => $g->count(),
                'damaged_quantity' => $g->sum('damaged_quantity'),
            ])
            ->sortByDesc('total_quantity')->values();

        $departments = $rows->pluck('department')->filter(fn($d) => $d && $d !== '-')->unique()->count();

        return Inertia::render('Reports/Borrowed', [
            'filters' => $f,
            'report' => [
                'period_label' => date('F', mktime(0, 0, 0, $f['month'], 1)) . ' ' . $f['year'],
                'totals' => [
                    'reservations' => $rows->count(),
                    'equipment_quantity' => $equipmentRows->sum('quantity'),
                    'equipment_types' => $equipmentRows->pluck('resource_name')->unique()->count(),
                    'departments' => $departments,
                    'damaged_quantity' => $equipmentRows->sum('damaged_quantity'),
                ],
                'equipment_summary' => $equipmentSummary,
                'detail_rows' => $rows,
            ],
        ]);
    }

    public function returns(Request $request)
    {
        $rows = Department::query()
            ->leftJoin('borrowings', function ($j) {
                $j->on('borrowings.department_id', '=', 'departments.id')
                    ->whereIn('borrowings.status', ['released', 'returned']);
            })
            ->select(
                'departments.id',
                'departments.name',
               DB::raw("COALESCE(SUM(CASE WHEN borrowings.status = 'returned' THEN borrowings.quantity - borrowings.damaged_quantity ELSE 0 END), 0) AS returned_count"),
                DB::raw("COALESCE(SUM(CASE WHEN borrowings.status = 'released' THEN borrowings.quantity ELSE 0 END), 0) AS unreturned_count"),
                DB::raw('COALESCE(SUM(borrowings.damaged_quantity), 0) AS damaged_total')
            )
            ->groupBy('departments.id', 'departments.name')
            ->get();

        // Borrowing records per department, for the Details modal
        $details = Borrowing::with(['user', 'equipment'])
            ->whereIn('status', ['released', 'returned'])
            ->whereNotNull('department_id')
            ->orderByDesc('borrowed_at')
            ->get()
            ->groupBy('department_id')
            ->map(fn($g) => $g->map(fn($b) => [
                'id' => $b->id,
                'request_code' => 'BOR-' . str_pad($b->id, 4, '0', STR_PAD_LEFT),
                'equipment' => $b->equipment?->name,
                'borrower' => $b->user?->name,
                'quantity' => (int) $b->quantity,
                'status' => $b->status,
                'borrowed_at' => $b->borrowed_at?->format('M d, Y g:i A'),
                'due_at' => $b->due_at?->format('M d, Y g:i A'),
                'returned_at' => $b->returned_at?->format('M d, Y g:i A'),
                'damaged_quantity' => (int) $b->damaged_quantity,
                'damage_note' => $b->damage_note,
            ])->values());

        return Inertia::render('Reports/Returns', ['rows' => $rows, 'details' => $details]);
    }

    public function exportBorrowed(Request $request)
    {
        $f = $this->filters($request);
        $rows = $this->monthlyRows($f);
        $name = 'monthly-report-' . $f['year'] . '-' . str_pad($f['month'], 2, '0', STR_PAD_LEFT) . '.csv';

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fputcsv($out, [
                'Request',
                'Event / Purpose',
                'Requester',
                'Department',
                'Resource',
                'Type',
                'Qty',
                'Start',
                'End',
                'Status',
                'Damaged Qty',
                'Damage Note',
                'Returned',
            ]);
            foreach ($rows as $r) {
                fputcsv($out, [
                    $r['request_code'],
                    $r['event_title'],
                    $r['requester_name'],
                    $r['department'],
                    $r['resource_name'],
                    ucfirst($r['item_type']),
                    $r['quantity'],
                    $r['start'],
                    $r['end'],
                    ucfirst($r['status']),
                    $r['damaged_quantity'],
                    $r['damage_note'],
                    $r['returned_at'],
                ]);
            }
            fclose($out);
        }, $name, ['Content-Type' => 'text/csv']);
    }
}
