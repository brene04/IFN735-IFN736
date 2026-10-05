<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CreateEmployeeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'office_id' => [
                'nullable', 
                'integer', 
                'exists:tbl_offices,office_id',
            ],
            'position_id' => [
                'nullable', 
                'integer', 
                'exists:tbl_positions,position_id',
            ],
            'employee_no' => [
                'required', 
                'string',
                'max:50',
                'unique:tbl_employees,employee_no',
            ],
            'first_name' => [
                'required', 
                'string',
                'max:50',
            ],
            'middle_name' => [
                'nullable', 
                'string',
                'max:50',
            ],
            'last_name' => [
                'required', 
                'string',
                'max:50',
            ],
            'email' => [
                'nullable', 
                'string', 
                'max:100',
                'unique:tbl_employees,email',
            ],
            'phone' => [
                'nullable', 
                'string', 
                'max:20',
                'unique:tbl_employees,phone',
            ],
            'date_hired' => [
                'required',
                'date',
            ],
            'status' => [
                'required', 
                'string', 
                'max:20',
            ],
        ];
    }
}
