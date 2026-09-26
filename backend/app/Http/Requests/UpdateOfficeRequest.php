<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOfficeRequest extends FormRequest
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
            'office_code' => [
                'required', 
                'string', 
                'max:50',
                Rule::unique('tbl_offices', 'office_code')
                    ->ignore($this->route('office_code'), 'office_code'),
            ],
            'office_name' => [
                'required', 
                'string',
                'max:100',
                Rule::unique('tbl_offices', 'office_name')
                    ->ignore($this->route('office_name'), 'office_name'),
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
