<?php

namespace App\Domain\Auth\Http\Controllers;

use App\Domain\Auth\Actions\GetArtistProfileAction;
use App\Domain\Auth\Http\Resources\ArtistPublicProfileResource;
use App\Domain\Auth\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ArtistProfileController extends Controller
{
    public function show(Request $request, User $user, GetArtistProfileAction $action): JsonResponse
    {
        /** @var User|null $viewer */
        $viewer = $request->user();

        $profile = $action->execute($user, $viewer);

        return (new ArtistPublicProfileResource($profile))->response();
    }
}
