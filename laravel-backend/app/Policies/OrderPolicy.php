<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class OrderPolicy
{
    use HandlesAuthorization;

    public function view(User $user, Order $order)
    {
        return $user->restaurant_id === $order->restaurant_id;
    }

    public function update(User $user, Order $order)
    {
        return $user->restaurant_id === $order->restaurant_id;
    }

    public function delete(User $user, Order $order)
    {
        return $user->restaurant_id === $order->restaurant_id;
    }
}
