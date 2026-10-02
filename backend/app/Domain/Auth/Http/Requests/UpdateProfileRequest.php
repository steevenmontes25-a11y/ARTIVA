<?php

namespace App\Domain\Auth\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
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
            'bio' => ['sometimes', 'nullable', 'string', 'max:500'],
            'avatar' => ['sometimes', 'nullable', 'file', 'image', 'max:4096'],

            // "Especialidades" reutiliza el mismo pivote artist_categories
            // del onboarding (no el campo JSON specialties, que queda sin usar
            // para evitar dos conceptos de "especialidad" en paralelo).
            'category_ids' => ['sometimes', 'array'],
            'category_ids.*' => ['integer', 'distinct', 'exists:categories,id'],

            'location' => ['sometimes', 'nullable', 'string', 'max:255'],

            'external_links' => ['sometimes', 'nullable', 'array'],
            'external_links.website' => ['nullable', 'url', 'max:255'],
            'external_links.instagram' => ['nullable', 'string', 'max:255'],
        ];
    }
}
