<?php

namespace App\Domain\Auth\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Igual que "auth:sanctum" pero nunca devuelve 401: si la petición trae un
 * Bearer token válido, autentica normalmente (request->user() funciona igual
 * que en las rutas protegidas). Si no trae token o es inválido, deja pasar
 * la petición como invitado (request->user() === null).
 *
 * Pensado para rutas de lectura pública (feed, discover, perfiles de
 * artista, comentarios) que deben mostrar contenido a cualquiera pero
 * personalizar campos como is_following/viewer_has_liked/viewer_has_saved
 * cuando sí hay sesión.
 */
class AuthenticateOptionally
{
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::guard('sanctum')->check()) {
            Auth::shouldUse('sanctum');
        }

        return $next($request);
    }
}
