<?php

namespace App\Domain\Social\Http\Controllers;

use App\Domain\Posts\Models\Post;
use App\Domain\Social\Models\Like;
use App\Domain\Social\Models\SavedPost;
use App\Http\Controllers\Controller;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostInteractionController extends Controller
{
    public function like(Request $request, Post $post): JsonResponse
    {
        /** @var \App\Domain\Auth\Models\User $user */
        $user = $request->user();

        try {
            Like::create(['user_id' => $user->id, 'post_id' => $post->id]);
        } catch (QueryException) {
            // Ya le había dado like (doble-tap rápido / condición de carrera): no es un error real.
        }

        return response()->json([
            'liked' => true,
            'likes_count' => Like::where('post_id', $post->id)->count(),
        ]);
    }

    public function unlike(Request $request, Post $post): JsonResponse
    {
        /** @var \App\Domain\Auth\Models\User $user */
        $user = $request->user();

        Like::where('user_id', $user->id)->where('post_id', $post->id)->delete();

        return response()->json([
            'liked' => false,
            'likes_count' => Like::where('post_id', $post->id)->count(),
        ]);
    }

    public function save(Request $request, Post $post): JsonResponse
    {
        /** @var \App\Domain\Auth\Models\User $user */
        $user = $request->user();

        try {
            SavedPost::create(['user_id' => $user->id, 'post_id' => $post->id]);
        } catch (QueryException) {
            // Ya estaba guardado (condición de carrera): no es un error real.
        }

        return response()->json(['saved' => true]);
    }

    public function unsave(Request $request, Post $post): JsonResponse
    {
        /** @var \App\Domain\Auth\Models\User $user */
        $user = $request->user();

        SavedPost::where('user_id', $user->id)->where('post_id', $post->id)->delete();

        return response()->json(['saved' => false]);
    }
}
