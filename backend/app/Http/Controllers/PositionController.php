<?php

namespace App\Http\Controllers;
use App\Http\Requests\CreatePositionRequest;
use App\Http\Requests\UpdatePositionRequest;
use App\Http\Requests\UpdateEmployeePositionRequest;

class PositionController extends Controller
{
    /**
     * Display a listing of position.
     */
    public function getPositions()
    {
        //
    }

    /**
     * Store a newly created position in storage.
     */
    public function createPosition(CreatePositionRequest $request)
    {
        $validated = $request->validated();        
        //
    }

    /**
     * Display the specified position.
     */
    public function getSinglePosition(int $position_id)
    {
        //
    }

    /**
     * Update the specified position in storage.
     */
    public function updatePosition(UpdatePositionRequest $request, int $position_id)
    {
        $validated = $request->validated();
        //
    }

    /**
     * Remove the specified position from storage.
     */
    public function deletePosition(int $position_id)
    {
        //
    }

    /**
     * Display the specified position assigned to the employee.
     */
    public function getSingleEmployeePosition(int $employee_id, int $position_id)
    {
        //
    }

    /**
     * Update the specified position assigned to the employee.
     */
    public function updateEmployeePosition(UpdateEmployeePositionRequest $request, int $employee_id, int $position_id)
    {
        $validated = $request->validated();
        //
    }

    /**
     * Remove the specified position assigned to the employee.
     */
    public function deleteEmployeePosition(int $employee_id, int $position_id)
    {
        //
    }
}
