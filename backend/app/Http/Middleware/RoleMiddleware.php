<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(
        Request $request, 
        Closure $next, 
        ...$roles
    ): Response
    {
        // Get the authenticated user
        $user = $request->user();
        if (!$user) {
            return response()->json(
                ['message' => 'Unauthenticated user.'], 
                401
            );
        }

        // Check if the user's role is allowed (name-based)
        $userRole = $user->role->role_name;
        if (!in_array($userRole, $roles, true)) {
            return response()->json(
                ['message' => 'You do not have permission to perform this action.'], 
                403
            );
        }
        
        return $next($request);
    }
}
