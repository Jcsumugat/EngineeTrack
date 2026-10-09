<?php

namespace App\Http\Controllers;

use App\Models\Facility;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FacilityController extends Controller
{
    private function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'capacity' => 'nullable|integer|min:1',
        ];
    }

    public function index()
    {
        return Inertia::render('Facilities/Index', [
            'facilities' => Facility::orderBy('name')->paginate(15),
        ]);
    }

    public function create()
    {
        return Inertia::render('Facilities/Create');
    }

    public function store(Request $request)
    {
        Facility::create($request->validate($this->rules()));
        return redirect()->route('facilities.index')->with('success', 'Facility added.');
    }

    public function edit(Facility $facility)
    {
        return Inertia::render('Facilities/Edit', ['facility' => $facility]);
    }

    public function update(Request $request, Facility $facility)
    {
        $data = $request->validate($this->rules());
        $data['is_active'] = $request->boolean('is_active');
        $facility->update($data);
        return redirect()->route('facilities.index')->with('success', 'Facility updated.');
    }

    public function destroy(Facility $facility)
    {
        if (Reservation::where('facility_id', $facility->id)->exists()) {
            $facility->update(['is_active' => false]);
            return back()->with('success', 'Facility has reservation history, so it was deactivated instead of deleted.');
        }

        $facility->delete();
        return back()->with('success', 'Facility deleted.');
    }
}