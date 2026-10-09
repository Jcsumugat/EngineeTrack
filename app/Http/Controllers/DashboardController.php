<?php

namespace App\Http\Controllers;

use App\Models\Borrowing;
use App\Models\Equipment;
use App\Models\Facility;
use App\Models\Reservation;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $isAdmin = $user->isAdmin();

        $res = Reservation::query()->when(!$isAdmin, fn ($q) => $q->where('user_id', $user->id));
        $bor = Borrowing::query()->when(!$isAdmin, fn ($q) => $q->where('user_id', $user->id));

        $recentBorrowings = (clone $bor)->with(['user', 'equipment'])->latest()->limit(6)->get()
            ->map(fn ($b) => [
                'key' => 'b' . $b->id,
                'type' => 'Borrowing',
                'item' => $b->equipment?->name,
                'quantity' => $b->quantity,
                'user' => $b->user?->name,
                'status' => $b->status,
                'created_at' => $b->created_at,
            ]);

        $recentReservations = (clone $res)->with(['user', 'equipment', 'facility'])->latest()->limit(6)->get()
            ->map(fn ($r) => [
                'key' => 'r' . $r->id,
                'type' => 'Reservation',
                'item' => $r->equipment?->name ?? $r->facility?->name,
                'quantity' => $r->quantity,
                'user' => $r->user?->name,
                'status' => $r->status,
                'created_at' => $r->created_at,
            ]);

        $recent = $recentBorrowings->concat($recentReservations)
            ->sortByDesc('created_at')->take(6)->values();

        $stock = $isAdmin
            ? Equipment::withBorrowedQty()->where('is_active', 1)->get()
                ->map(fn ($e) => [
                    'id' => $e->id,
                    'name' => $e->name,
                    'total' => $e->total_quantity,
                    'available' => $e->available_quantity,
                ])
                ->sortBy(fn ($e) => $e['total'] > 0 ? $e['available'] / $e['total'] : 1)
                ->take(6)->values()
            : [];

        return Inertia::render('Dashboard', [
            'equipmentCount' => Equipment::where('is_active', 1)->count(),
            'facilityCount' => Facility::where('is_active', 1)->count(),
            'pendingReservations' => (clone $res)->where('status', 'pending')->count(),
            'pendingBorrowings' => (clone $bor)->where('status', 'pending')->count(),
            'unreturned' => (clone $bor)->where('status', 'released')->count(),
            'recent' => $recent,
            'stock' => $stock,
        ]);
    }
}