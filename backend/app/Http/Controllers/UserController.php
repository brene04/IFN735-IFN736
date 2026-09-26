<?php

namespace App\Http\Controllers;
use App\Http\Requests\CreateUserRequest;
use App\Http\Requests\UpdateUserRequest;

class UserController extends Controller
{
    /**
     * Display a listing of user.
     */
    public function getUsers()
    {
        //
    }

    /**
     * Store a newly created user in storage.
     */
    public function createUser(CreateUserRequest $request)
    {
        $validated = $request->validated();
        //
    }

    /**
     * Display the specified user.
     */
    public function getSingleUser(int $user_id)
    {
        //
    }

    /**
     * Update the specified user in storage.
     */
    public function updateUser(UpdateUserRequest $request, int $user_id)
    {
        $validated = $request->validated();
        //
    }

    /**
     * Remove the specified user from storage.
     */
    public function deleteUser(int $user_id)
    {
        //
    }
}
