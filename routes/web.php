<?php

use App\Http\Controllers\BorrowingController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FacilityController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\StockLogController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/calendar', [CalendarController::class, 'index'])->name('calendar.index');
    Route::get('/calendar/events', [CalendarController::class, 'events'])->name('calendar.events');

    Route::get('/reservations', [ReservationController::class, 'index'])->name('reservations.index');
    Route::get('/reservations/create', [ReservationController::class, 'create'])->name('reservations.create');
    Route::post('/reservations', [ReservationController::class, 'store'])->name('reservations.store');
    Route::patch('/reservations/{reservation}/cancel', [ReservationController::class, 'cancel'])->name('reservations.cancel');

    Route::get('/borrowings', [BorrowingController::class, 'index'])->name('borrowings.index');
    Route::get('/borrowings/create', [BorrowingController::class, 'create'])->name('borrowings.create');
    Route::post('/borrowings', [BorrowingController::class, 'store'])->name('borrowings.store');

    Route::middleware('role:admin')->group(function () {
        Route::resource('users', UserController::class)->except('show');

        Route::resource('inventory', InventoryController::class)->parameters(['inventory' => 'equipment']);
        Route::post('/inventory/{equipment}/stock', [InventoryController::class, 'manageStock'])->name('inventory.stock');
        Route::get('/stock-log', [StockLogController::class, 'index'])->name('stock-log.index');
        Route::get('/stock-log/export', [StockLogController::class, 'export'])->name('stock-log.export');

        Route::resource('facilities', FacilityController::class)->except('show');

        Route::patch('/reservations/{reservation}/approve', [ReservationController::class, 'approve'])->name('reservations.approve');
        Route::patch('/reservations/{reservation}/disapprove', [ReservationController::class, 'disapprove'])->name('reservations.disapprove');
        Route::patch('/reservations/{reservation}/release', [ReservationController::class, 'release'])->name('reservations.release');
        Route::patch('/reservations/{reservation}/complete', [ReservationController::class, 'complete'])->name('reservations.complete');

        Route::patch('/borrowings/{borrowing}/approve', [BorrowingController::class, 'approve'])->name('borrowings.approve');
        Route::patch('/borrowings/{borrowing}/disapprove', [BorrowingController::class, 'disapprove'])->name('borrowings.disapprove');
        Route::patch('/borrowings/{borrowing}/release', [BorrowingController::class, 'release'])->name('borrowings.release');
        Route::patch('/borrowings/{borrowing}/return', [BorrowingController::class, 'return'])->name('borrowings.return');
        Route::patch('/borrowings/{borrowing}/replace', [BorrowingController::class, 'replace'])->name('borrowings.replace');

        Route::get('/reports/borrowed', [ReportController::class, 'borrowed'])->name('reports.borrowed');
        Route::get('/reports/borrowed/export', [ReportController::class, 'exportBorrowed'])->name('reports.borrowed.export');
        Route::get('/reports/returns', [ReportController::class, 'returns'])->name('reports.returns');
    });
});

require __DIR__ . '/auth.php';