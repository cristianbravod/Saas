<?php

namespace App\Policies;

use App\Models\MenuItem;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class MenuItemPolicy
{
    use HandlesAuthorization;

    public function view(User $user, MenuItem $menuItem)
    {
        return $user->restaurant_id === $menuItem->restaurant_id;
    }

    public function update(User $user, MenuItem $menuItem)
    {
        return $user->restaurant_id === $menuItem->restaurant_id && $user->role === 'admin';
    }

    public function delete(User $user, MenuItem $menuItem)
    {
        return $user->restaurant_id === $menuItem->restaurant_id && $user->role === 'admin';
    }
}
