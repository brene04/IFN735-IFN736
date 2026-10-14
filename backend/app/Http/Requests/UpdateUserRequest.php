<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
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
            'role_id' => [
                'nullable', 
                'integer', 
                'exists:tbl_roles,role_id',
            ],
            'employee_id' => [
                'nullable', 
                'integer', 
                'exists:tbl_employees,employee_id',
            ],            
            'username' => [
                'required', 
                'string', 
                'max:50',
                Rule::unique('tbl_users', 'username')
                    ->ignore($this->route('user_id'), 'user_id'),
            ],
            'email' => [
                'required', 
                'email', 
                'max:100',
                Rule::unique('tbl_users', 'email')
                    ->ignore($this->route('user_id'), 'user_id'),
            ],
            'password_hash' => [
                'sometimes',
                'nullable',
                'string', 
                Password::min(8),
            ],
            'status' => [
                'required', 
                'string', 
                'max:20',
            ],
        ];
    }
}
