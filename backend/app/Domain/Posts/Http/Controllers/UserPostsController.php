<?php

namespace App\Domain\Posts\Http\Controllers;

use App\Domain\Auth\Models\User;
use App\Domain\Posts\Http\Resources\PostThumbnailResource;
use App\Domain\Posts\Models\Post;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserPostsController extends Controller
{
    public function index(Request $request, User $user): JsonResponse
    {
        $perPage = min(max((int) $request->integer('per_page', 15), 1), 30);
        $cursor = $request->query('cursor');

        $paginator = Post::query()
            ->where('user_id', $user->id)
            ->where('status', 'published')
            ->with('media')
            ->withCount([
                'likedBy as likes_count',
                'comments as comments_count',
            ])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->cursorPaginate($perPage, ['*'], 'cursor', is_string($cursor) ? $cursor : null);

        return response()->json([
            'data' => PostThumbnailResource::collection($paginator->getCollection()),
            'meta' => [
                'next_cursor' => $paginator->nextCursor()?->encode(),
                'has_more' => $paginator->hasMorePages(),
            ],
        ]);
    }
}
