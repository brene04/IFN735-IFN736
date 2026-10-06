<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{

    /**
     * Authenticate the user and start a session.
     */
    public function login(Request $request)
    {
        // Validate input 
        $validated = $request->validate([
            'loginId' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);  

        // Determine whether login is email or employee ID.
        $userId = filter_var($validated['loginId'], FILTER_VALIDATE_EMAIL)
            ? 'email'
            : 'employee_id';

        $credentials = [
            $userId => $validated['loginId'],
            'password' => $validated['password'],
        ];

        // Attempt login
        if (!Auth::attempt($credentials)) {
            return response()->json(
                ['message' => 'Invalid credentials.'], 
                401
            );
        }

        // Regenerate session ID (to prevent session fixation attacks)
        $request->session()->regenerate();

        // Get authenticated user
        $user = Auth::user();

        // Update last login
        $user->last_login = now();
        $user->save();

        return response()->json([
            'message' => 'Login successful.',
            'user' => $user
        ]);
    }

    /**
     * Log out the user and invalidate the session.
     */
    public function logout(Request $request)
    {
        // Log out the current user
        Auth::guard('web')->logout();

        // Invalidate the current session
        $request->session()->invalidate();

        // Regenerate CSRF token
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logout successful.'
        ]);
    }

}
