<?php

namespace App\Domain\Feed\Http\Controllers;

use App\Domain\Feed\Actions\GetFeedAction;
use App\Domain\Posts\Http\Resources\PostResource;
use App\Domain\Posts\Jobs\RecordPostViewsJob;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeedController extends Controller
{
    public function index(Request $request, GetFeedAction $action): JsonResponse
    {
        $perPage = min(max((int) $request->integer('per_page', 10), 1), 30);
        $cursor = $request->query('cursor');

        /** @var \App\Domain\Auth\Models\User|null $viewer */
        $viewer = $request->user();

        $result = $action->execute($viewer, is_string($cursor) ? $cursor : null, $perPage);

        if ($result['posts']->isNotEmpty()) {
            RecordPostViewsJob::dispatch(
                $result['posts']->pluck('id')->all(),
                $viewer?->id,
            );
        }

        return response()->json([
            'data' => PostResource::collection($result['posts']),
            'meta' => [
                'next_cursor' => $result['next_cursor'],
                'prev_cursor' => $result['prev_cursor'],
                'has_more' => $result['has_more'],
            ],
        ]);
    }
}
