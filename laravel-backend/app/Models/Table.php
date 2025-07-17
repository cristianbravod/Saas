<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Table extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id',
        'name',
        'capacity',
        'status',
    ];

    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
