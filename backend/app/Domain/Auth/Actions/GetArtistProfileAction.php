<?php

namespace App\Domain\Auth\Actions;

use App\Domain\Auth\Models\User;
use Illuminate\Database\Eloquent\Builder;

class GetArtistProfileAction
{
    /**
     * Carga el perfil público con sus contadores y si el viewer ya sigue
     * a este usuario. $profileUser ya viene resuelto por route-model-binding
     * (artists/{user:username}), así que solo se le agregan counts/exists.
     *
     * $viewer es null en modo invitado; en ese caso se omite el loadExists
     * de is_following y ArtistPublicProfileResource lo expone como false.
     */
    public function execute(User $profileUser, ?User $viewer): User
    {
        $profileUser
            ->loadCount([
                'followerRelations as followers_count',
                'followingRelations as following_count',
                'posts as posts_count' => fn (Builder $query) => $query->where('status', 'published'),
                // Colaboraciones que este artista publicó (collaboration_requests
                // ya existe con user_id real) — no es todavía "colaboraciones en
                // las que participó" (eso necesita el módulo de Collaborations
                // completo, con su propia tabla de participantes), pero es un
                // conteo real, no inventado.
                'collaborationRequests as collaborations_count',
            ])
            ->load('artistProfile');

        if ($viewer !== null) {
            $profileUser->loadExists([
                'followerRelations as is_following' => fn (Builder $query) => $query
                    ->where('follower_id', $viewer->id),
            ]);
        }

        return $profileUser;
    }
}
