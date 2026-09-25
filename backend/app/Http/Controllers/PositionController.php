<?php

namespace App\Http\Controllers;

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
    public function createPosition()
    {
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
    public function updatePosition(int $position_id)
    {
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
