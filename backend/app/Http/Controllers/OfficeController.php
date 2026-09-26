<?php

namespace App\Http\Controllers;
use App\Http\Requests\CreateOfficeRequest;
use App\Http\Requests\UpdateOfficeRoleRequest;

class OfficeController extends Controller
{
    /**
     * Display a listing of office.
     */
    public function getOffices()
    {
        //
    }

    /**
     * Store a newly created office in storage.
     */
    public function createOffice(CreateOfficeRequest $request)
    {
        $validated = $request->validated();
        //
    }

    /**
     * Display the specified office.
     */
    public function getSingleOffice(int $office_id)
    {
        //
    }

    /**
     * Update the specified office in storage.
     */
    public function updateOffice(UpdateOfficeRequest $request, int $office_id)
    {
        $validated = $request->validated();
        //
    }

    /**
     * Remove the specified office from storage.
     */
    public function deleteOffice(int $office_id)
    {
        //
    }
}
