<?php

namespace App\Http\Controllers;

use App\Models\Equipment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StockLogController extends Controller
{
    private const TYPES = ['all', 'added', 'replacement', 'damaged', 'deducted'];

    private function filters(Request $request): array
    {
        $type = (string) $request->input('type', 'all');
        if (!in_array($type, self::TYPES, true)) $type = 'all';

        return [
            'equipment_id' => $request->input('equipment_id') ?: null,
            'type' => $type,
            'from' => $request->input('from') ?: null,
            'to' => $request->input('to') ?: null,
        ];
    }

    // Shared joins and filters
    private function base(array $f)
    {
        return DB::table('equipment_stock_logs as l')
            ->join('equipment as e', 'e.id', '=', 'l.equipment_id')
            ->leftJoin('users as u', 'u.id', '=', 'l.created_by')
            ->when($f['equipment_id'], fn ($q, $id) => $q->where('l.equipment_id', $id))
            ->when($f['from'], fn ($q, $d) => $q->whereDate('l.created_at', '>=', $d))
            ->when($f['to'], fn ($q, $d) => $q->whereDate('l.created_at', '<=', $d))
            ->when($f['type'] === 'damaged', fn ($q) => $q->where('l.reason', 'like', 'Damaged on return%'))
            ->when($f['type'] === 'replacement', fn ($q) => $q->where('l.reason', 'like', 'Replacement%'))
            ->when($f['type'] === 'added', fn ($q) => $q
                ->where('l.change', '>', 0)
                ->where(fn ($w) => $w->whereNull('l.reason')->orWhere('l.reason', 'not like', 'Replacement%')))
            ->when($f['type'] === 'deducted', fn ($q) => $q
                ->where('l.change', '<', 0)
                ->where(fn ($w) => $w->whereNull('l.reason')->orWhere('l.reason', 'not like', 'Damaged on return%')));
    }

    private function listQuery(array $f)
    {
        return $this->base($f)
            ->select(
                'l.id', 'l.equipment_id', 'l.change', 'l.reason', 'l.created_at',
                'e.name as equipment_name', 'e.total_quantity', 'u.name as user_name'
            )
            // Sum of every later change for the same equipment, so balance = current total - later changes
            ->selectRaw('(SELECT COALESCE(SUM(l2.`change`), 0) FROM equipment_stock_logs l2
                          WHERE l2.equipment_id = l.equipment_id AND l2.id > l.id) AS later_changes')
            ->orderByDesc('l.id');
    }

    private function typeOf(int $change, ?string $reason): string
    {
        $reason = (string) $reason;
        if (str_starts_with($reason, 'Damaged on return')) return 'damaged';
        if (str_starts_with($reason, 'Replacement')) return 'replacement';
        return $change >= 0 ? 'added' : 'deducted';
    }

    private function present($row): array
    {
        $change = (int) $row->change;

        return [
            'id' => $row->id,
            'equipment_id' => $row->equipment_id,
            'equipment_name' => $row->equipment_name,
            'change' => $change,
            'type' => $this->typeOf($change, $row->reason),
            'reason' => $row->reason,
            'user' => $row->user_name,
            'balance' => (int) $row->total_quantity - (int) $row->later_changes,
            'created_at' => $row->created_at ? Carbon::parse($row->created_at)->format('M d, Y g:i A') : '-',
        ];
    }

    public function index(Request $request)
    {
        $f = $this->filters($request);

        $logs = $this->listQuery($f)
            ->paginate(10)
            ->withQueryString()
            ->through(fn ($row) => $this->present($row));

        $s = $this->base($f)->selectRaw("
            COALESCE(SUM(CASE WHEN l.`change` > 0 AND (l.reason IS NULL OR l.reason NOT LIKE 'Replacement%') THEN l.`change` END), 0) AS added,
            COALESCE(SUM(CASE WHEN l.reason LIKE 'Replacement%' THEN l.`change` END), 0) AS replaced,
            COALESCE(SUM(CASE WHEN l.reason LIKE 'Damaged on return%' THEN -l.`change` END), 0) AS damaged,
            COALESCE(SUM(l.`change`), 0) AS net
        ")->first();

        return Inertia::render('StockLog/Index', [
            'logs' => $logs,
            'summary' => [
                'added' => (int) $s->added,
                'replaced' => (int) $s->replaced,
                'damaged' => (int) $s->damaged,
                'net' => (int) $s->net,
            ],
            'equipment' => Equipment::orderBy('name')->get(['id', 'name']),
            'filters' => $f,
        ]);
    }

    public function export(Request $request)
    {
        $f = $this->filters($request);
        $rows = $this->listQuery($f)->get()->map(fn ($row) => $this->present($row));

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Date', 'Equipment', 'Type', 'Change', 'Balance After', 'Reason', 'Recorded By']);
            foreach ($rows as $r) {
                fputcsv($out, [
                    $r['created_at'], $r['equipment_name'], ucfirst($r['type']),
                    $r['change'], $r['balance'], $r['reason'], $r['user'],
                ]);
            }
            fclose($out);
        }, 'stock-log-' . now()->format('Ymd') . '.csv', ['Content-Type' => 'text/csv']);
    }
}