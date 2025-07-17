<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\User;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        'App\Models\Order' => 'App\Policies\OrderPolicy',
        'App\Models\MenuItem' => 'App\Policies\MenuItemPolicy',
        'App\Models\Category' => 'App\Policies\CategoryPolicy',
        'App\Models\SpecialDish' => 'App\Policies\SpecialDishPolicy',
        'App\Models\Table' => 'App\Policies\TablePolicy',
    ];

    /**
     * Register any authentication / authorization services.
     *
     * @return void
     */
    public function boot()
    {
        $this->registerPolicies();

        Gate::define('admin', function (User $user) {
            return $user->role === 'admin';
        });

        Gate::define('chef', function (User $user) {
            return in_array($user->role, ['admin', 'chef']);
        });

        Gate::define('mesero', function (User $user) {
            return in_array($user->role, ['admin', 'mesero']);
        });
    }
}
