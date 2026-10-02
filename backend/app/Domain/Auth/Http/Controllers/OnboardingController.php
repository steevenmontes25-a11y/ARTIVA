<?php

namespace App\Domain\Auth\Http\Controllers;

use App\Domain\Auth\Actions\CompleteOnboardingAction;
use App\Domain\Auth\Http\Requests\CompleteOnboardingRequest;
use App\Domain\Auth\Http\Resources\UserResource;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class OnboardingController extends Controller
{
    public function complete(CompleteOnboardingRequest $request, CompleteOnboardingAction $action): JsonResponse
    {
        /** @var \App\Domain\Auth\Models\User $currentUser */
        $currentUser = $request->user();

        $user = $action->execute($currentUser, $request->validated());

        return (new UserResource($user))->response();
    }
}
