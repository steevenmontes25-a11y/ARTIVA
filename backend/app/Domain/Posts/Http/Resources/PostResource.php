<?php

namespace App\Domain\Posts\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Domain\Posts\Models\Post
 */
class PostResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'caption' => $this->caption,
            'category' => $this->whenLoaded('category', fn () => $this->category === null ? null : [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ]),
            'media' => PostMediaResource::collection($this->whenLoaded('media')),
            'hashtags' => $this->whenLoaded('hashtags', fn () => $this->hashtags->pluck('tag')),
            'author' => [
                'id' => $this->user->id,
                'username' => $this->user->username,
                'avatar_url' => $this->user->avatar_url,
                'discipline' => $this->user->artistProfile?->primary_discipline,
            ],
            'counts' => [
                'likes' => $this->likes_count ?? 0,
                'comments' => $this->comments_count ?? 0,
                // No hay tabla de "shares" todavía (fuera de alcance de este
                // módulo: compartir a otras apps se implementa después).
            ],
            'viewer_has_liked' => (bool) ($this->viewer_has_liked ?? false),
            'viewer_has_saved' => (bool) ($this->viewer_has_saved ?? false),
            'created_at' => $this->created_at,
        ];
    }
}
