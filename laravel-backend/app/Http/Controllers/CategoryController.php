<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $categories = Category::where('restaurant_id', $request->user()->restaurant_id)->get();
        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $this->authorize('admin');

        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $category = Category::create([
            'restaurant_id' => $request->user()->restaurant_id,
            'name' => $request->name,
        ]);

        return response()->json($category, 201);
    }

    public function show(Request $request, Category $category)
    {
        $this->authorize('view', $category);
        return response()->json($category);
    }

    public function update(Request $request, Category $category)
    {
        $this->authorize('update', $category);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
        ]);

        $category->update($request->all());

        return response()->json($category);
    }

    public function destroy(Category $category)
    {
        $this->authorize('delete', $category);
        $category->delete();
        return response()->json(null, 204);
    }
}
