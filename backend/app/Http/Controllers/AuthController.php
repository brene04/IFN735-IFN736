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
        $validated = $request->validated();
        //
    }

    /**
     * Log out the user and invalidate the session.
     */
    public function logout(Request $request)
    {
        $validated = $request->validated();
        //
    }

}
