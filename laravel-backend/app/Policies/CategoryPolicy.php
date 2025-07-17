<?php

namespace App\Policies;

use App\Models\Category;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class CategoryPolicy
{
    use HandlesAuthorization;

    public function view(User $user, Category $category)
    {
        return $user->restaurant_id === $category->restaurant_id;
    }

    public function update(User $user, Category $category)
    {
        return $user->restaurant_id === $category->restaurant_id && $user->role === 'admin';
    }

    public function delete(User $user, Category $category)
    {
        return $user->restaurant_id === $category->restaurant_id && $user->role === 'admin';
    }
}
