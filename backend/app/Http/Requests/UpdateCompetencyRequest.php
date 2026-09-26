<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCompetencyRequest extends FormRequest
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
            'competency_code' => [
                'required', 
                'string', 
                'max:50',
                Rule::unique('tbl_competencies', 'competency_code')
                    ->ignore($this->route('competency_code'), 'competency_code'),

                ],
            'competency_name' => [
                'required', 
                'string',
                'max:100',
                Rule::unique('tbl_competencies', 'competency_name')
                    ->ignore($this->route('competency_name'), 'competency_name'),
 
                ],
            'description' => [
                'nullable', 
                'string',
            ],
            'competency_type' => [
                'required', 
                'string', 
                'max:50',
            ],
            'status' => [
                'required', 
                'string', 
                'max:20',
            ],
        ];
    }
}
