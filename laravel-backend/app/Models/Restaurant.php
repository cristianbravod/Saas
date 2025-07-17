<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Restaurant extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'logo_path',
        'primary_color',
        'secondary_color',
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function menuItems()
    {
        return $this->hasMany(MenuItem::class);
    }

    public function categories()
    {
        return $this->hasMany(Category::class);
    }

    public function specialDishes()
    {
        return $this->hasMany(SpecialDish::class);
    }

    public function tables()
    {
        return $this->hasMany(Table::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
