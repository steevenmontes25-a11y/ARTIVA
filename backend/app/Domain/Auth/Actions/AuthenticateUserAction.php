<?php

namespace App\Domain\Auth\Actions;

use App\Domain\Auth\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthenticateUserAction
{
    /**
     * Resuelve el usuario por email o username y verifica el password.
     * Lanza una ValidationException (422, formato estándar de Laravel) si
     * las credenciales no coinciden, sin filtrar cuál de los dos falló.
     */
    public function execute(string $login, string $password): User
    {
        $user = str_contains($login, '@')
            ? User::where('email', $login)->first()
            : User::where('username', $login)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['Las credenciales proporcionadas no son correctas.'],
            ]);
        }

        return $user->loadMissing(['artistProfile', 'categories']);
    }
}
