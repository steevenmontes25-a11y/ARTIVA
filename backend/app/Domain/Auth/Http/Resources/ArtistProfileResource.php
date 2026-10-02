<?php

namespace App\Domain\Auth\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Domain\Auth\Models\ArtistProfile
 */
class ArtistProfileResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'primary_discipline' => $this->primary_discipline,
            'specialties' => $this->specialties,
            'location' => $this->location,
            'external_links' => $this->external_links,
            'onboarding_completed' => $this->onboarding_completed,
        ];
    }
}
