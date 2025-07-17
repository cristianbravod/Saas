<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TableController;
use App\Http\Controllers\SpecialDishController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// Auth
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::middleware('auth:sanctum')->post('/auth/logout', [AuthController::class, 'logout']);
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});


Route::prefix('v1')->group(function () {
    // Public routes
    Route::get('/menu-publico', [MenuController::class, 'publicMenu']);
    Route::get('/platos-especiales', [SpecialDishController::class, 'index']);


    Route::middleware('auth:sanctum')->group(function () {
        // Menu
        Route::apiResource('/menu', MenuController::class);
        Route::patch('/menu/{id}/disponibilidad', [MenuController::class, 'toggleAvailability']);

        // Categories
        Route::apiResource('/categorias', CategoryController::class);

        // Orders
        Route::apiResource('/ordenes', OrderController::class);

        // Tables
        Route::apiResource('/mesas', TableController::class);

        // Special Dishes
        Route::apiResource('/platos-especiales', SpecialDishController::class)->except(['index']);

        // Reports
        Route::get('/reportes/ventas', [ReportController::class, 'sales']);
        Route::get('/reportes/productos-populares', [ReportController::class, 'popularProducts']);

        // Admin only routes
        Route::middleware('can:admin')->group(function() {
            Route::apiResource('/menu', MenuController::class)->except(['index', 'show']);
            Route::apiResource('/categorias', CategoryController::class)->except(['index', 'show']);
            Route::apiResource('/platos-especiales', SpecialDishController::class)->except(['index', 'show']);
            Route::apiResource('/mesas', TableController::class);
        });
    });
});
