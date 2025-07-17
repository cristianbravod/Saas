<?php

namespace App\Policies;

use App\Models\SpecialDish;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class SpecialDishPolicy
{
    use HandlesAuthorization;

    public function view(User $user, SpecialDish $specialDish)
    {
        return $user->restaurant_id === $specialDish->restaurant_id;
    }

    public function update(User $user, SpecialDish $specialDish)
    {
        return $user->restaurant_id === $specialDish->restaurant_id && $user->role === 'admin';
    }

    public function delete(User $user, SpecialDish $specialDish)
    {
        return $user->restaurant_id === $specialDish->restaurant_id && $user->role === 'admin';
    }
}
