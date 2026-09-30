<?php

namespace App\Http\Controllers;
use App\Http\Requests\CreateEmployeeRequest;
use App\Http\Requests\UpdateEmployeeRequest;

class EmployeeController extends Controller
{
    /**
     * Store bulk-imported employees in storage.
     */
    public function importEmployees()
    {
        // $validated = $request->validated(); **NOT YET**
        //
    }

    /**
     * Display a listing of employee.
     */
    public function getEmployees()
    {
        //
    }

    /**
     * Store a newly created employee in storage.
     */
    public function createEmployee(CreateEmployeeRequest $request)
    {
        $validated = $request->validated();
        //
    }

    /**
     * Display the specified employee.
     */
    public function getSingleEmployee(int $employee_id)
    {
        //
    }

    /**
     * Update the specified employee in storage.
     */
    public function updateEmployee(UpdateEmployeeRequest $request, int $employee_id)
    {
        $validated = $request->validated();
        //
    }

    /**
     * Remove the specified employee from storage.
     */
    public function deleteEmployee(int $employee_id)
    {
        //
    }
}
