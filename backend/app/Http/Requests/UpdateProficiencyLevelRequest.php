<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProficiencyLevelRequest extends FormRequest
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
            'competency_id' => $this->route('competency_id'),
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
            'competency_id' => [
                'required', 
                'integer',
                'exists:tbl_competencies,competency_id',
            ],
            'level_number' => [
                'required',
                'integer',
                Rule::in([1, 2, 3, 4]),
                Rule::unique('tbl_proficiency_levels', 'level_number')
                    ->where(
                        fn ($query) =>
                            $query->where(
                                'competency_id',
                                $this->route('competency_id')
                            )
                    )
                    ->ignore(
                        $this->route('proficiency_level_id'),
                        'proficiency_level_id'
                    ),
            ],
            'description' => [
                'required',
                'string',
            ],
            'status' => [
                'required',
                'string',
                'max:20',
            ],
            'behavioral_indicators' => [
                'required',
                'array',
                'min:1',
            ],
            'behavioral_indicators.*.indicator_code' => [
                'required',
                'string',
                'max:10',
                'distinct',
            ],
            'behavioral_indicators.*.description' => [
                'required',
                'string',
            ],
            'behavioral_indicators.*.status' => [
                'required',
                'string',
                'max:20',
            ],
        ];
    }
}
