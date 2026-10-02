<?php

namespace App\Domain\Social\Http\Controllers;

use App\Domain\Auth\Models\User;
use App\Domain\Social\Models\Follow;
use App\Http\Controllers\Controller;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class FollowController extends Controller
{
    public function toggle(Request $request, User $user): JsonResponse
    {
        /** @var User $viewer */
        $viewer = $request->user();

        if ($viewer->id === $user->id) {
            throw ValidationException::withMessages([
                'user' => ['No puedes seguirte a ti mismo.'],
            ]);
        }

        $existing = Follow::where('follower_id', $viewer->id)->where('followed_id', $user->id)->first();

        if ($existing) {
            $existing->delete();
            $following = false;
        } else {
            try {
                Follow::create(['follower_id' => $viewer->id, 'followed_id' => $user->id]);
            } catch (QueryException) {
                // Ya existía (condición de carrera): no es un error real.
            }

            $following = true;
        }

        return response()->json([
            'following' => $following,
            'followers_count' => Follow::where('followed_id', $user->id)->count(),
        ]);
    }
}
