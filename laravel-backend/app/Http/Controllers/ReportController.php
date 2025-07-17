<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function sales(Request $request)
    {
        $this->authorize('admin');

        $sales = Order::where('restaurant_id', $request->user()->restaurant_id)
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('sum(total) as total'))
            ->groupBy('date')
            ->get();

        return response()->json($sales);
    }

    public function popularProducts(Request $request)
    {
        $this->authorize('admin');

        $popularProducts = OrderItem::whereHas('order', function ($query) use ($request) {
                $query->where('restaurant_id', $request->user()->restaurant_id);
            })
            ->select('orderable_type', 'orderable_id', DB::raw('count(*) as total'))
            ->groupBy('orderable_type', 'orderable_id')
            ->orderBy('total', 'desc')
            ->with('orderable')
            ->get();

        return response()->json($popularProducts);
    }
}
