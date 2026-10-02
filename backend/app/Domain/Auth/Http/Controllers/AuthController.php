<?php

namespace App\Domain\Auth\Http\Controllers;

use App\Domain\Auth\Actions\AuthenticateUserAction;
use App\Domain\Auth\Actions\RegisterUserAction;
use App\Domain\Auth\Http\Requests\LoginRequest;
use App\Domain\Auth\Http\Requests\RegisterRequest;
use App\Domain\Auth\Http\Resources\UserResource;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function register(RegisterRequest $request, RegisterUserAction $action): JsonResponse
    {
        $user = $action->execute($request->validated());

        return (new UserResource($user))
            ->additional(['token' => $user->createToken('mobile-app')->plainTextToken])
            ->response()
            ->setStatusCode(201);
    }

    public function login(LoginRequest $request, AuthenticateUserAction $action): JsonResponse
    {
        /** @var array{login: string, password: string} $credentials */
        $credentials = $request->validated();

        $user = $action->execute($credentials['login'], $credentials['password']);

        return (new UserResource($user))
            ->additional(['token' => $user->createToken('mobile-app')->plainTextToken])
            ->response();
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada correctamente.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return (new UserResource($request->user()->loadMissing(['artistProfile', 'categories'])))->response();
    }
}
