<?php

namespace App\Domain\Auth\Http\Controllers;

use App\Domain\Auth\Actions\UpdateProfileAction;
use App\Domain\Auth\Http\Requests\UpdateProfileRequest;
use App\Domain\Auth\Http\Resources\UserResource;
use App\Domain\Auth\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class ProfileController extends Controller
{
    public function update(UpdateProfileRequest $request, UpdateProfileAction $action): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $updated = $action->execute($user, $request->validated(), $request->file('avatar'));

        return (new UserResource($updated))->response();
    }
}
