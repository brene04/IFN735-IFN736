<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class CreateUserRequest extends FormRequest
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
                'required', 
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
                'unique:tbl_users,username',
            ],
            'email' => [
                'required', 
                'email', 
                'max:100',
                'unique:tbl_users,email',
            ],
            'password_hash' => [
                'required', 
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
