<?php

namespace App\Domain\Posts\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Domain\Posts\Models\PostMedia
 */
class PostMediaResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            // TODO(storage): cuando se conecte un disco cloud (S3), generar
            // aquí una URL firmada temporal en vez de devolver la URL cruda.
            // En dev (disco local) no aplica todavía.
            'url' => $this->url,
            'type' => $this->type,
            'position' => $this->position,
            'duration_seconds' => $this->duration_seconds,
        ];
    }
}
