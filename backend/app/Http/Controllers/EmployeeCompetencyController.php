<?php

namespace App\Http\Controllers;
use App\Http\Requests\CreateEmployeeCompetencyRequest;
use App\Http\Requests\UpdateEmployeeCompetencyRequest;

class EmployeeCompetencyController extends Controller
{
    /**
     * Display a listing of employee competency.
     */
    public function getEmployeeCompetencies(int $employee_id)
    {
        //
    }

    /**
     * Store a newly created employee competency in storage.
     */
    public function createEmployeeCompetency(CreateEmployeeCompetencyRequest $request, int $employee_id)
    {
        $validated = $request->validated();
        //
    }

    /**
     * Display the specified employee competency.
     */
    public function getSingleEmployeeCompetency(int $employee_id, int $competency_id)
    {
        //
    }

    /**
     * Update the specified employee competency in storage.
     */
    public function updateEmployeeCompetency(UpdateEmployeeCompetencyRequest $request, int $employee_id, int $competency_id)
    {
        $validated = $request->validated();
        //
    }

    /**
     * Remove the specified employee competency from storage.
     */
    public function deleteEmployeeCompetency(int $employee_id, int $competency_id)
    {
        //
    }

}
