<?php

use App\Domain\Auth\Http\Middleware\AuthenticateOptionally;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Laravel registra por defecto un redirect a la ruta con name "login"
        // para invitados no autenticados (usado en apps con UI web). Esta es
        // una API pura sin esa ruta — sin este override, cualquier request a
        // una ruta protegida que no mande "Accept: application/json" (un
        // curl plano, un navegador, etc.) explota con 500 "Route [login] not
        // defined" en vez de devolver 401 JSON limpio.
        $middleware->redirectGuestsTo(fn () => null);

        $middleware->alias([
            'auth.optional' => AuthenticateOptionally::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
