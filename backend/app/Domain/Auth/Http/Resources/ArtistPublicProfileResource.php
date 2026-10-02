<?php

namespace App\Domain\Auth\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Domain\Auth\Models\User
 */
class ArtistPublicProfileResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'username' => $this->username,
            'name' => $this->name,
            'avatar_url' => $this->avatar_url,
            'bio' => $this->bio,
            'primary_discipline' => $this->artistProfile?->primary_discipline,
            'specialties' => $this->artistProfile?->specialties,
            'location' => $this->artistProfile?->location,
            'external_links' => $this->artistProfile?->external_links,
            'counts' => [
                'followers' => $this->followers_count ?? 0,
                'following' => $this->following_count ?? 0,
                'posts' => $this->posts_count ?? 0,
                'collaborations' => $this->collaborations_count ?? 0,
                // El dominio Projects todavía no existe (sin tabla/migración
                // propia) — 0 real, no un valor inventado, hasta ese módulo.
                'projects' => 0,
            ],
            'is_following' => (bool) ($this->is_following ?? false),
        ];
    }
}
