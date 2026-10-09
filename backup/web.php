<?php

use App\Http\Controllers\{AuthController, BorrowingController, CalendarController, DashboardController,
    FacilityController, InventoryController, ProfileController, ReportController,
    ReservationController, UserController};
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/dashboard');

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');

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
        Route::post('/inventory/{equipment}/stock', [InventoryController::class, 'addStock'])->name('inventory.stock');

        Route::resource('facilities', FacilityController::class)->except('show');

        Route::patch('/reservations/{reservation}/approve', [ReservationController::class, 'approve'])->name('reservations.approve');
        Route::patch('/reservations/{reservation}/disapprove', [ReservationController::class, 'disapprove'])->name('reservations.disapprove');
        Route::patch('/reservations/{reservation}/release', [ReservationController::class, 'release'])->name('reservations.release');
        Route::patch('/reservations/{reservation}/complete', [ReservationController::class, 'complete'])->name('reservations.complete');

        Route::patch('/borrowings/{borrowing}/approve', [BorrowingController::class, 'approve'])->name('borrowings.approve');
        Route::patch('/borrowings/{borrowing}/disapprove', [BorrowingController::class, 'disapprove'])->name('borrowings.disapprove');
        Route::patch('/borrowings/{borrowing}/release', [BorrowingController::class, 'release'])->name('borrowings.release');
        Route::patch('/borrowings/{borrowing}/return', [BorrowingController::class, 'return'])->name('borrowings.return');

        Route::get('/reports/borrowed', [ReportController::class, 'borrowed'])->name('reports.borrowed');
        Route::get('/reports/borrowed/export', [ReportController::class, 'exportBorrowed'])->name('reports.borrowed.export');
        Route::get('/reports/returns', [ReportController::class, 'returns'])->name('reports.returns');
    });
});