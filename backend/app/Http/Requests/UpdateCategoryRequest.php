<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
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
            'competency_category_code' => [
                'required', 
                'string', 
                'max:50',
                Rule::unique('tbl_competency_categories', 'competency_category_id')
                    ->ignore($this->route('competency_category_id'), 'competency_category_id'),

                ],
            'competency_category_name' => [
                'required', 
                'string',
                'max:100',
                Rule::unique('tbl_competency_categories', 'competency_category_name')
                    ->ignore($this->route('competency_category_name'), 'competency_category_name'),
            ],
            'description' => [
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
