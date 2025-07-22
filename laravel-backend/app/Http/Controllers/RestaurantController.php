<?php

namespace App\Http\Controllers;

use App\Models\Restaurant;
use Illuminate\Http\Request;

class RestaurantController extends Controller
{
    public function index()
    {
        $this->authorize('superadmin');
        $restaurants = Restaurant::all();
        return response()->json($restaurants);
    }

    public function store(Request $request)
    {
        $this->authorize('superadmin');

        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:restaurants',
        ]);

        $restaurant = Restaurant::create($request->all());

        return response()->json($restaurant, 201);
    }

    public function show(Restaurant $restaurant)
    {
        $this->authorize('superadmin');
        return response()->json($restaurant);
    }

    public function update(Request $request, Restaurant $restaurant)
    {
        $this->authorize('superadmin');

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'sometimes|required|string|max:255|unique:restaurants,slug,' . $restaurant->id,
        ]);

        $restaurant->update($request->all());

        return response()->json($restaurant);
    }

    public function destroy(Restaurant $restaurant)
    {
        $this->authorize('superadmin');
        $restaurant->delete();
        return response()->json(null, 204);
    }
}
