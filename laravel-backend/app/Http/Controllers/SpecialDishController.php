<?php

namespace App\Http\Controllers;

use App\Models\SpecialDish;
use Illuminate\Http\Request;

class SpecialDishController extends Controller
{
    public function index(Request $request)
    {
        $specialDishes = SpecialDish::where('restaurant_id', $request->user()->restaurant_id)->get();
        return response()->json($specialDishes);
    }

    public function store(Request $request)
    {
        $this->authorize('admin');

        $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'start_date' => 'required|date',
        ]);

        $specialDish = SpecialDish::create([
            'restaurant_id' => $request->user()->restaurant_id,
            'name' => $request->name,
            'description' => $request->description,
            'price' => $request->price,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
        ]);

        return response()->json($specialDish, 201);
    }

    public function show(Request $request, SpecialDish $specialDish)
    {
        $this->authorize('view', $specialDish);
        return response()->json($specialDish);
    }

    public function update(Request $request, SpecialDish $specialDish)
    {
        $this->authorize('update', $specialDish);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'price' => 'sometimes|required|numeric|min:0',
            'start_date' => 'sometimes|required|date',
        ]);

        $specialDish->update($request->all());

        return response()->json($specialDish);
    }

    public function destroy(SpecialDish $specialDish)
    {
        $this->authorize('delete', $specialDish);
        $specialDish->delete();
        return response()->json(null, 204);
    }
}
