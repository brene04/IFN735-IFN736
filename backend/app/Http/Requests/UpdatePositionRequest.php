<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePositionRequest extends FormRequest
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
            'position_code' => [
                'required', 
                'string', 
                'max:50',
                Rule::unique('tbl_positions', 'position_code')
                    ->ignore($this->route('position_code'), 'position_code'),
                ],
            'position_title' => [
                'required', 
                'string',
                'max:100',
                Rule::unique('tbl_positions', 'position_title')
                    ->ignore($this->route('position_title'), 'position_title'),
            ],
            'description' => [
                'nullable', 
                'string',
            ],
            'department' => [
                'required', 
                'string', 
                'max:100',
            ],
            'employment_type' => [
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
