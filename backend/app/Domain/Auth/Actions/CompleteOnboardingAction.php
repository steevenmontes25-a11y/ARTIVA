<?php

namespace App\Domain\Auth\Actions;

use App\Domain\Auth\Models\User;
use Illuminate\Support\Facades\DB;

class CompleteOnboardingAction
{
    /**
     * Marca el onboarding como completo: guarda las categorías del artista
     * ("qué tipo de artista eres" + "qué quiere descubrir", unificadas en
     * artist_categories ya que el MVP no distingue ambos conceptos en BD),
     * actualiza la bio y prende artist_profiles.onboarding_completed.
     *
     * @param  array{category_ids: array<int, int>, interest_ids?: array<int, int>|null, bio?: string|null}  $data
     */
    public function execute(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data): User {
            if (array_key_exists('bio', $data) && $data['bio'] !== null) {
                $user->update(['bio' => $data['bio']]);
            }

            $categoryIds = array_values(array_unique(array_merge(
                $data['category_ids'],
                $data['interest_ids'] ?? [],
            )));

            $user->categories()->sync($categoryIds);

            $user->artistProfile()->update(['onboarding_completed' => true]);

            return $user->fresh(['artistProfile', 'categories']);
        });
    }
}
