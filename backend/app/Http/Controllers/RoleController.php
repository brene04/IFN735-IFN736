<?php

namespace App\Http\Controllers;
use App\Http\Requests\CreateRoleRequest;
use App\Http\Requests\UpdateRoleRequest;
use App\Http\Requests\UpdateUserRoleRequest;

class RoleController extends Controller
{
    /**
     * Display a listing of role.
     */
    public function getRoles()
    {
        //
    }

    /**
     * Store a newly created role in storage.
     */
    public function createRole(CreateRoleRequest $request)
    {
        $validated = $request->validated();
        //
    }

    /**
     * Display the specified role.
     */
    public function getSingleRole(int $role_id)
    {
        //
    }

    /**
     * Update the specified role in storage.
     */
    public function updateRole(UpdateRoleRequest $request, int $role_id)
    {
        $validated = $request->validated();
        //
    }

    /**
     * Remove the specified role from storage.
     */
    public function deleteRole(int $role_id)
    {
        //
    }

    /**
     * Display the specified user's role.
     */
    public function getSingleUserRole(int $user_id)
    {
        //
    }

    /**
     * Update the specified user's role in storage.
     */
    public function updateUserRole(UpdateUserRoleRequest $request, int $user_id)
    {
        $validated = $request->validated();
        //
    }

    /**
     * Remove the specified user's role from storage.
     */
    public function deleteUserRole(int $user_id)
    {
        //
    }
}
