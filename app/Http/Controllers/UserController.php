<?php

namespace App\Http\Controllers;

use App\Models\Borrowing;
use App\Models\Department;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        return Inertia::render('Users/Index', ['users' => User::with('department')->orderBy('name')->paginate(15)]);
    }

    public function create()
    {
        return Inertia::render('Users/Create', ['departments' => Department::orderBy('name')->get()]);
    }

    public function edit(User $user)
    {
        return Inertia::render('Users/Edit', ['user' => $user, 'departments' => Department::orderBy('name')->get()]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => ['required', Rule::in(['admin', 'faculty_staff'])],
            'department_id' => 'required_if:role,faculty_staff|nullable|exists:departments,id',
        ]);
        User::create($data);
        return redirect()->route('users.index')->with('success', 'User created.');
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'role' => ['required', Rule::in(['admin', 'faculty_staff'])],
            'department_id' => 'required_if:role,faculty_staff|nullable|exists:departments,id',
        ]);

        if ($user->id === auth()->id() && $data['role'] !== 'admin') {
            return back()->with('error', 'You cannot remove your own admin role.');
        }

        if (empty($data['password'])) unset($data['password']);
        $user->update($data);
        return redirect()->route('users.index')->with('success', 'User updated.');
    }

    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }
        if (Borrowing::where('user_id', $user->id)->exists() || Reservation::where('user_id', $user->id)->exists()) {
            return back()->with('error', 'This user has borrowing or reservation records and cannot be deleted.');
        }
        $user->delete();
        return back()->with('success', 'User deleted.');
    }
}