<?php

namespace App\Domain\Posts\Http\Controllers;

use App\Domain\Auth\Models\User;
use App\Domain\Posts\Actions\CreatePostAction;
use App\Domain\Posts\Actions\DeletePostAction;
use App\Domain\Posts\Http\Requests\CreatePostRequest;
use App\Domain\Posts\Http\Resources\PostResource;
use App\Domain\Posts\Models\Post;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function store(CreatePostRequest $request, CreatePostAction $action): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $post = $action->execute($user, $request->validated(), $request->file('media'));

        return (new PostResource($post))->response()->setStatusCode(201);
    }

    public function destroy(Request $request, Post $post, DeletePostAction $action): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($post->user_id !== $user->id) {
            abort(403, 'No puedes borrar publicaciones de otros usuarios.');
        }

        $action->execute($post);

        return response()->json(['message' => 'Publicación eliminada.']);
    }
}
