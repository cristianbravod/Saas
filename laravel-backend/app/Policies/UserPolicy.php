<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class UserPolicy
{
    use HandlesAuthorization;

    public function view(User $currentUser, User $user)
    {
        return $currentUser->restaurant_id === $user->restaurant_id && $currentUser->role === 'admin';
    }

    public function update(User $currentUser, User $user)
    {
        return $currentUser->restaurant_id === $user->restaurant_id && $currentUser->role === 'admin';
    }

    public function delete(User $currentUser, User $user)
    {
        return $currentUser->restaurant_id === $user->restaurant_id && $currentUser->role === 'admin';
    }
}
