<?php

namespace App\Http\Controllers;

use App\Models\Table;
use Illuminate\Http\Request;

class TableController extends Controller
{
    public function index(Request $request)
    {
        $tables = Table::where('restaurant_id', $request->user()->restaurant_id)->get();
        return response()->json($tables);
    }

    public function store(Request $request)
    {
        $this->authorize('admin');

        $request->validate([
            'name' => 'required|string|max:255',
            'capacity' => 'required|integer|min:1',
        ]);

        $table = Table::create([
            'restaurant_id' => $request->user()->restaurant_id,
            'name' => $request->name,
            'capacity' => $request->capacity,
        ]);

        return response()->json($table, 201);
    }

    public function show(Request $request, Table $table)
    {
        $this->authorize('view', $table);
        return response()->json($table);
    }

    public function update(Request $request, Table $table)
    {
        $this->authorize('update', $table);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'capacity' => 'sometimes|required|integer|min:1',
            'status' => 'sometimes|required|in:available,occupied,reserved',
        ]);

        $table->update($request->all());

        return response()->json($table);
    }

    public function destroy(Table $table)
    {
        $this->authorize('delete', $table);
        $table->delete();
        return response()->json(null, 204);
    }
}
