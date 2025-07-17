<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SpecialDish extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id',
        'name',
        'description',
        'price',
        'image_path',
        'available',
        'start_date',
        'end_date',
    ];

    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function orderItems()
    {
        return $this->morphMany(OrderItem::class, 'orderable');
    }
}
