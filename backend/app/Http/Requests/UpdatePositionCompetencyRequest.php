<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePositionCompetencyRequest extends FormRequest
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
            'position_id' => $this->route('position_id'),
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
            'position_id' => [
                'required',
                'integer',
                'exists:tbl_positions,position_id',
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
            'priority' => [
                'required', 
                'integer',
            ],
        ];
    }
}
