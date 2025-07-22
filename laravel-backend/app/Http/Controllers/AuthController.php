<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        \Log::info('Login request received:', $request->all());
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'restaurant_id' => 'required|exists:restaurants,id'
        ]);

        $user = User::where('email', $request->email)->where('restaurant_id', $request->restaurant_id)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        return response()->json([
            'token' => $user->createToken('auth-token')->plainTextToken,
            'user' => $user
        ]);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'restaurant_id' => 'required|exists:restaurants,id',
            'role' => 'required|in:admin,chef,mesero,superadmin'
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'restaurant_id' => $request->role === 'superadmin' ? null : $request->restaurant_id,
            'role' => $request->role,
        ]);

        return response()->json([
            'token' => $user->createToken('auth-token')->plainTextToken,
            'user' => $user
        ], 201);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logout exitoso']);
    }
}
