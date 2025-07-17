<?php

namespace App\Http\Controllers;

use App\Events\OrderCreated;
use App\Models\Order;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $orders = Order::where('restaurant_id', $request->user()->restaurant_id)->get();
        return response()->json($orders);
    }

    public function store(Request $request)
    {
        $request->validate([
            'table_id' => 'required|exists:tables,id',
            'items' => 'required|array',
            'items.*.id' => 'required',
            'items.*.type' => 'required|in:menu_item,special_dish',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
        ]);

        $total = collect($request->items)->sum(function ($item) {
            return $item['quantity'] * $item['price'];
        });

        $order = Order::create([
            'restaurant_id' => $request->user()->restaurant_id,
            'user_id' => $request->user()->id,
            'table_id' => $request->table_id,
            'total' => $total,
        ]);

        foreach ($request->items as $item) {
            $order->items()->create([
                'orderable_id' => $item['id'],
                'orderable_type' => $item['type'] === 'menu_item' ? 'App\\Models\\MenuItem' : 'App\\Models\\SpecialDish',
                'quantity' => $item['quantity'],
                'price' => $item['price'],
            ]);
        }

        broadcast(new OrderCreated($order))->toOthers();

        return response()->json($order->load('items'), 201);
    }

    public function show(Request $request, Order $order)
    {
        $this->authorize('view', $order);
        return response()->json($order->load('items'));
    }

    public function update(Request $request, Order $order)
    {
        $this->authorize('update', $order);

        $request->validate([
            'status' => 'required|in:pending,preparing,ready,served,paid',
        ]);

        $order->update(['status' => $request->status]);

        return response()->json($order);
    }

    public function destroy(Order $order)
    {
        $this->authorize('delete', $order);
        $order->delete();
        return response()->json(null, 204);
    }
}
