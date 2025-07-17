<?php

namespace App\Policies;

use App\Models\Table;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class TablePolicy
{
    use HandlesAuthorization;

    public function view(User $user, Table $table)
    {
        return $user->restaurant_id === $table->restaurant_id;
    }

    public function update(User $user, Table $table)
    {
        return $user->restaurant_id === $table->restaurant_id && $user->role === 'admin';
    }

    public function delete(User $user, Table $table)
    {
        return $user->restaurant_id === $table->restaurant_id && $user->role === 'admin';
    }
}
