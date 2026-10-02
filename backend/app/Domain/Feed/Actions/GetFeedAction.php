<?php

namespace App\Domain\Feed\Actions;

use App\Domain\Auth\Models\User;
use App\Domain\Posts\Models\Post;
use App\Domain\Social\Models\Follow;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Arma la página del feed "Descubrir".
 *
 * Antes del módulo de Recomendación, el orden es una heurística simple:
 * recencia + engagement (likes/comments) + un boost para artistas
 * "emergentes" (pocos seguidores pero con engagement en el post).
 *
 * Importante sobre paginación: la consulta usa cursorPaginate() ordenado
 * por columnas reales e indexadas (created_at, id) — eso es lo que hace la
 * paginación por cursor correcta y eficiente (sin saltos ni duplicados
 * cuando llegan posts nuevos entre páginas). El "mezclado" por engagement
 * se aplica DESPUÉS, solo para reordenar visualmente los N posts que ya
 * se iban a devolver en esta página — nunca se descartan posts fuera de
 * esa ventana, así que no hay pérdida de contenido ni corrupción de cursor.
 */
class GetFeedAction
{
    private const EMERGING_FOLLOWERS_THRESHOLD = 100;

    private const RECENCY_WINDOW_HOURS = 72;

    /**
     * $viewer es null en modo invitado (rutas de lectura pública sin sesión):
     * en ese caso no se agregan los withExists de viewer_has_liked/saved, así
     * que PostResource los recibe ausentes y los expone como false (ver su
     * fallback `?? false`) en vez de fallar o consultar con un id inexistente.
     *
     * @return array{posts: Collection<int, Post>, next_cursor: ?string, prev_cursor: ?string, has_more: bool}
     */
    public function execute(?User $viewer, ?string $cursor, int $perPage): array
    {
        $paginator = Post::query()
            ->where('status', 'published')
            ->with(['media', 'category', 'user.artistProfile'])
            ->withCount([
                'likedBy as likes_count',
                'comments as comments_count',
            ])
            ->when($viewer !== null, fn (Builder $query) => $query->withExists([
                'likedBy as viewer_has_liked' => fn (Builder $query) => $query->where('users.id', $viewer->id),
                'savedBy as viewer_has_saved' => fn (Builder $query) => $query->where('users.id', $viewer->id),
            ]))
            ->addSelect([
                'author_followers_count' => Follow::query()
                    ->selectRaw('count(*)')
                    ->whereColumn('followed_id', 'posts.user_id'),
            ])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->cursorPaginate($perPage, ['*'], 'cursor', $cursor);

        // Cursores calculados ANTES de reordenar, a partir del orden real de
        // la consulta (created_at/id) — así el infinite scroll sigue siendo
        // correcto sin importar cómo se muestren los posts en esta página.
        $nextCursor = $paginator->nextCursor()?->encode();
        $prevCursor = $paginator->previousCursor()?->encode();
        $hasMore = $paginator->hasMorePages();

        return [
            'posts' => $this->rerankForDisplay($paginator->getCollection()),
            'next_cursor' => $nextCursor,
            'prev_cursor' => $prevCursor,
            'has_more' => $hasMore,
        ];
    }

    /**
     * @param  Collection<int, Post>  $posts
     * @return Collection<int, Post>
     */
    private function rerankForDisplay(Collection $posts): Collection
    {
        return $posts
            ->sortByDesc(fn (Post $post): float => $this->score($post))
            ->values();
    }

    private function score(Post $post): float
    {
        $hoursOld = $post->created_at->diffInHours(now());
        $recencyScore = max(0, self::RECENCY_WINDOW_HOURS - $hoursOld);

        $likesCount = (int) $post->getAttribute('likes_count');
        $commentsCount = (int) $post->getAttribute('comments_count');
        $engagementScore = ($likesCount * 2) + ($commentsCount * 3);

        $authorFollowersCount = (int) $post->getAttribute('author_followers_count');
        $isEmerging = $authorFollowersCount < self::EMERGING_FOLLOWERS_THRESHOLD && $engagementScore > 0;
        $emergingBoost = $isEmerging ? $engagementScore * 1.5 : 0;

        return $recencyScore + $engagementScore + $emergingBoost;
    }
}
