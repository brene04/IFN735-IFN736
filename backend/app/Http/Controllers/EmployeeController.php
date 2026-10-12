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
        $employees = Employee::select([
            'employee_id',
            'position_id',
            'office_id',
            'employee_no',
            'first_name',
            'middle_name',
            'last_name',
            'email',
            'status',
        ])
        ->with([
            'office:office_id,office_name,office_code',
            'position:position_id,position_title,employment_type',
            'gapAnalyses:employee_id,position_id,status',
        ])
        ->get();

        return response()->json($employees,200);
    }

    /**
     * Store a newly created employee in storage.
     */
    public function createEmployee(CreateEmployeeRequest $request)
    {
        $validated = $request->validated();
        $employee = Employee::create($validated);

        return response()->json([
            'message' => 'Employee created successfully.',
            'data' => $employee
        ], 201);
    }

    /**
     * Display the specified employee.
     */
    public function getSingleEmployee(int $employee_id)
    {
        $employee = Employee::with([
            'office:office_id,office_name,office_code',
            'position:position_id,position_title,employment_type',
            'gapAnalyses:employee_id,position_id,status',
        ])->findOrFail($employee_id);

        return response()->json($employee, 200);
    }

    /**
     * Update the specified employee in storage.
     */
    public function updateEmployee(UpdateEmployeeRequest $request, int $employee_id)
    {
        $validated = $request->validated();
        $employee = Employee::findOrFail($employee_id);
        $employee->update($validated);

        return response()->json([
            'message' => 'Employee updated successfully.',
            'data' => $employee
        ], 200);
    }

    /**
     * Remove the specified employee from storage.
     */
    public function deleteEmployee(int $employee_id)
    {
        $employee = Employee::findOrFail($employee_id);
        $employee->delete();
        return response()->json([
            'message' => 'Employee deleted successfully.'
        ], 200);
    }
}
