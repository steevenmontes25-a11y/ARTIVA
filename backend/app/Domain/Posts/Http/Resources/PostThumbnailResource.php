<?php

namespace App\Domain\Posts\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Versión liviana de un post para grillas (perfil, búsqueda): sin autor,
 * caption ni categoría — solo lo que necesita un thumbnail. Deliberadamente
 * más chico que PostResource (bajo consumo de datos en listas largas).
 *
 * @mixin \App\Domain\Posts\Models\Post
 */
class PostThumbnailResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $firstMedia = $this->media->first();

        return [
            'id' => $this->id,
            'thumbnail_url' => $firstMedia?->url,
            'media_type' => $firstMedia?->type,
            'likes_count' => $this->likes_count ?? 0,
            'comments_count' => $this->comments_count ?? 0,
        ];
    }
}
