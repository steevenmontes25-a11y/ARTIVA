<?php

namespace App\Domain\Posts\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $postId = $this->route('post')?->id;

        return [
            'content' => ['required', 'string', 'max:1000'],
            // Si es una respuesta, el comentario padre debe pertenecer al mismo post.
            'parent_id' => [
                'nullable',
                'integer',
                Rule::exists('comments', 'id')->where('post_id', $postId),
            ],
        ];
    }
}
