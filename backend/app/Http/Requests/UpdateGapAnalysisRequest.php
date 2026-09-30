<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateGapAnalysisRequest extends FormRequest
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
            'employee_id' => [
                'required', 
                'integer', 
                'exists:tbl_employees,employee_id',
            ],
            'position_id' => [
                'required', 
                'integer', 
                'exists:tbl_positions,position_id',
            ],            
            'analysis_date' => [
                'required', 
                'date', 
            ],
            'status' => [
                'required', 
                'string', 
                'max:20',
            ],    
            'remarks' => [
                'nullable', 
                'string', 
            ],
        ];
    }
}
