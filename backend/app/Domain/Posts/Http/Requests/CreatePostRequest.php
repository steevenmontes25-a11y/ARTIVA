<?php

namespace App\Domain\Posts\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreatePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $type = $this->input('type');

        return [
            'type' => ['required', 'in:video,image,audio,text'],
            'caption' => ['nullable', 'string', 'max:2000'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],

            'hashtags' => ['nullable', 'array', 'max:10'],
            // Acepta hashtags con o sin "#" inicial; CreatePostAction normaliza.
            'hashtags.*' => ['string', 'max:50', 'regex:/^#?[\p{L}\p{N}_]+$/u'],

            'media' => [
                Rule::requiredIf($type !== 'text'),
                'nullable',
                'file',
                'max:51200',
                Rule::when($type === 'image', ['image']),
                Rule::when($type === 'video', ['mimetypes:video/mp4,video/quicktime,video/webm']),
                Rule::when($type === 'audio', ['mimetypes:audio/mpeg,audio/mp4,audio/wav,audio/x-m4a,audio/aac']),
            ],
        ];
    }
}
