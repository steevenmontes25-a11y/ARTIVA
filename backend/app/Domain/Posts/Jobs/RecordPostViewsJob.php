<?php

namespace App\Domain\Posts\Jobs;

use App\Domain\Posts\Models\PostView;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Registra en post_views los posts que se sirvieron en una página del feed.
 * Se despacha a la cola (QUEUE_CONNECTION) para no bloquear la respuesta HTTP.
 */
class RecordPostViewsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * @param  array<int, int>  $postIds
     */
    public function __construct(
        private readonly array $postIds,
        private readonly ?int $viewerId,
        private readonly string $source = 'feed',
    ) {}

    public function handle(): void
    {
        if ($this->postIds === []) {
            return;
        }

        $now = now();

        PostView::insert(array_map(fn (int $postId): array => [
            'post_id' => $postId,
            'user_id' => $this->viewerId,
            'source' => $this->source,
            'created_at' => $now,
        ], $this->postIds));
    }
}
