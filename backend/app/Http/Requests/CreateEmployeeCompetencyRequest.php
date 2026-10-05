<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateEmployeeCompetencyRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Merge the route parameter into the request data before validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'employee_id' => $this->route('employee_id'),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'employee_id' => [
                'required',
                'integer',
                'exists:tbl_employees,employee_id',
            ],
            'competency_id' => [
                'required', 
                'integer',
                'exists:tbl_competencies,competency_id',
            ],
            'current_level' => [
                'required',
                'integer',
                Rule::in([1, 2, 3, 4]),
            ],
            'evidence' => [
                'nullable', 
                'string',
            ],
            'status' => [
                'required', 
                'string', 
                'max:20',
            ],
        ];
    }
}
