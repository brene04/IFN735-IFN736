<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateGapAnalysisResultsRequest extends FormRequest
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
            'gap_analysis_id' => [
                'required', 
                'integer', 
                'exists:tbl_gap_analyses,gap_analysis_id',
            ],
            'competency_id' => [
                'required', 
                'integer', 
                'exists:tbl_competencies,competency_id',
            ],            
            'required_level' => [
                'required',
                'integer',
                Rule::in([1, 2, 3, 4]), 
            ],
            'current_level' => [
                'required',
                'integer',
                Rule::in([1, 2, 3, 4]), 
            ],
            'gap_level' => [
                'required',
                'integer',
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
