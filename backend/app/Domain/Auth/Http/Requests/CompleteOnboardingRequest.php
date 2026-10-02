<?php

namespace App\Domain\Auth\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CompleteOnboardingRequest extends FormRequest
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
            // "¿Qué tipo de artista eres?" — al menos una categoría.
            'category_ids' => ['required', 'array', 'min:1'],
            'category_ids.*' => ['integer', 'distinct', 'exists:categories,id'],

            // "¿Qué quieres descubrir?" — opcional.
            'interest_ids' => ['nullable', 'array'],
            'interest_ids.*' => ['integer', 'distinct', 'exists:categories,id'],

            'bio' => ['nullable', 'string', 'max:500'],
        ];
    }
}
