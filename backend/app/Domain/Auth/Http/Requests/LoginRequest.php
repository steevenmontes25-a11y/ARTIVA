<?php

namespace App\Domain\Auth\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            // Acepta email o username en el mismo campo; el backend detecta cuál es.
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
        ];
    }
}
