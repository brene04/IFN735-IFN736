<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CreateReportRequest extends FormRequest
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
            'report_name' => [
                'required',
                'string',
                'max:100',
            ],

            'file_path' => [
                'required',
                'string',
            ],

            'file_format' => [
                'required',
                'string',
                'max:10',
            ],
        ];
    }
}
