<?php

namespace App\Http\Controllers;

class PositionController extends Controller
{
    /**
     * Display a listing of position.
     */
    public function index()
    {
        //
    }

    /**
     * Store a newly created position in storage.
     */
    public function store()
    {
        //
    }

    /**
     * Display the specified position.
     */
    public function show(int $position_id)
    {
        //
    }

    /**
     * Update the specified position in storage.
     */
    public function update(int $position_id)
    {
        //
    }

    /**
     * Remove the specified position from storage.
     */
    public function destroy(int $position_id)
    {
        //
    }


    /**
     * Display the specified employee's assigned positions.
     */
    public function getEmployeePositions(int $employee_id)
    {
        //
    }

    /**
     * Store a newly assigned position for the specified employee.
     */
    public function createEmployeePosition(int $employee_id)
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
    public function updateEmployeePosition(int $employee_id, int $position_id)
    {
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
