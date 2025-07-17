<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    public function index(Request $request)
    {
        $menuItems = MenuItem::where('restaurant_id', $request->user()->restaurant_id)->get();
        return response()->json($menuItems);
    }

    public function store(Request $request)
    {
        $this->authorize('admin');

        $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
        ]);

        $menuItem = MenuItem::create([
            'restaurant_id' => $request->user()->restaurant_id,
            'category_id' => $request->category_id,
            'name' => $request->name,
            'description' => $request->description,
            'price' => $request->price,
        ]);

        return response()->json($menuItem, 201);
    }

    public function show(Request $request, MenuItem $menuItem)
    {
        $this->authorize('view', $menuItem);
        return response()->json($menuItem);
    }

    public function update(Request $request, MenuItem $menuItem)
    {
        $this->authorize('update', $menuItem);

        $request->validate([
            'category_id' => 'sometimes|required|exists:categories,id',
            'name' => 'sometimes|required|string|max:255',
            'price' => 'sometimes|required|numeric|min:0',
        ]);

        $menuItem->update($request->all());

        return response()->json($menuItem);
    }

    public function destroy(MenuItem $menuItem)
    {
        $this->authorize('delete', $menuItem);
        $menuItem->delete();
        return response()->json(null, 204);
    }

    public function toggleAvailability(Request $request, MenuItem $menuItem)
    {
        $this->authorize('update', $menuItem);
        $menuItem->update(['available' => !$menuItem->available]);
        return response()->json($menuItem);
    }

    public function publicMenu(Request $request)
    {
        // This needs a way to get restaurant_id from the request, e.g. from a subdomain or a query parameter
        // For now, I'll assume a restaurant_id is passed as a query parameter
        $request->validate(['restaurant_id' => 'required|exists:restaurants,id']);
        $menuItems = MenuItem::where('restaurant_id', $request->restaurant_id)->where('available', true)->get();
        return response()->json($menuItems);
    }
}
