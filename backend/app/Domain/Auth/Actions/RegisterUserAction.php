<?php

namespace App\Domain\Auth\Actions;

use App\Domain\Auth\Models\ArtistProfile;
use App\Domain\Auth\Models\User;
use Illuminate\Support\Facades\DB;

class RegisterUserAction
{
    /**
     * Crea el usuario junto con su artist_profile vacío en una sola transacción.
     *
     * @param  array{name: string, username: string, email: string, password: string}  $data
     */
    public function execute(array $data): User
    {
        return DB::transaction(function () use ($data): User {
            $user = User::create([
                'name' => $data['name'],
                'username' => $data['username'],
                'email' => $data['email'],
                'password' => $data['password'],
            ]);

            ArtistProfile::create([
                'user_id' => $user->id,
            ]);

            return $user->fresh(['artistProfile', 'categories']);
        });
    }
}
