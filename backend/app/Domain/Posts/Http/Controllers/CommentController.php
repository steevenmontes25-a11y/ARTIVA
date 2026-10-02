<?php

namespace App\Domain\Posts\Http\Controllers;

use App\Domain\Auth\Models\User;
use App\Domain\Posts\Actions\CreateCommentAction;
use App\Domain\Posts\Http\Requests\CreateCommentRequest;
use App\Domain\Posts\Http\Resources\CommentResource;
use App\Domain\Posts\Models\Comment;
use App\Domain\Posts\Models\Post;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function index(Request $request, Post $post): JsonResponse
    {
        $perPage = min(max((int) $request->integer('per_page', 15), 1), 30);

        $paginator = Comment::query()
            ->where('post_id', $post->id)
            ->whereNull('parent_id')
            ->with(['user', 'replies.user'])
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json([
            'data' => CommentResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function store(CreateCommentRequest $request, Post $post, CreateCommentAction $action): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $comment = $action->execute($user, $post, $request->validated());

        return (new CommentResource($comment))->response()->setStatusCode(201);
    }
}
