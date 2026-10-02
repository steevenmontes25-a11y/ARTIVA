<?php

namespace Tests\Feature\Feed;

use App\Domain\Auth\Models\User;
use App\Domain\Feed\Models\Category;
use App\Domain\Posts\Jobs\RecordPostViewsJob;
use App\Domain\Posts\Models\Post;
use App\Domain\Posts\Models\PostMedia;
use App\Domain\Social\Models\Like;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use ReflectionClass;
use Tests\TestCase;

class FeedTest extends TestCase
{
    use RefreshDatabase;

    public function test_feed_is_accessible_without_authentication_with_viewer_fields_false(): void
    {
        $post = Post::factory()->create(['status' => 'published']);

        $response = $this->getJson('/api/feed');

        $response->assertOk()
            ->assertJsonPath('data.0.id', $post->id)
            ->assertJsonPath('data.0.viewer_has_liked', false)
            ->assertJsonPath('data.0.viewer_has_saved', false);
    }

    public function test_feed_returns_published_posts_with_expected_shape(): void
    {
        $viewer = User::factory()->create();
        $author = User::factory()->create();
        $category = Category::factory()->create();

        $post = Post::factory()->for($author)->for($category)->create(['status' => 'published']);
        PostMedia::factory()->for($post)->create(['position' => 0]);

        $response = $this->actingAs($viewer, 'sanctum')->getJson('/api/feed');

        $response->assertOk()->assertJsonStructure([
            'data' => [
                '*' => [
                    'id', 'type', 'caption', 'category', 'media', 'author' => [
                        'id', 'username', 'avatar_url', 'discipline',
                    ],
                    'counts' => ['likes', 'comments'],
                    'viewer_has_liked', 'viewer_has_saved', 'created_at',
                ],
            ],
            'meta' => ['next_cursor', 'prev_cursor', 'has_more'],
        ]);

        $response->assertJsonPath('data.0.id', $post->id)
            ->assertJsonPath('data.0.author.username', $author->username)
            ->assertJsonCount(1, 'data.0.media');
    }

    public function test_feed_excludes_non_published_posts(): void
    {
        $viewer = User::factory()->create();
        Post::factory()->create(['status' => 'draft']);
        $published = Post::factory()->create(['status' => 'published']);

        $response = $this->actingAs($viewer, 'sanctum')->getJson('/api/feed');

        $response->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $published->id);
    }

    public function test_feed_reflects_viewer_like_and_save_state(): void
    {
        $viewer = User::factory()->create();
        $likedPost = Post::factory()->create(['status' => 'published']);
        $untouchedPost = Post::factory()->create(['status' => 'published']);

        $viewer->likedPosts()->attach($likedPost->id);
        $viewer->savedPosts()->attach($likedPost->id);

        $response = $this->actingAs($viewer, 'sanctum')->getJson('/api/feed');

        $byId = collect($response->json('data'))->keyBy('id');

        $this->assertTrue($byId[$likedPost->id]['viewer_has_liked']);
        $this->assertTrue($byId[$likedPost->id]['viewer_has_saved']);
        $this->assertFalse($byId[$untouchedPost->id]['viewer_has_liked']);
        $this->assertFalse($byId[$untouchedPost->id]['viewer_has_saved']);
    }

    public function test_feed_cursor_pagination_covers_all_posts_without_duplicates_or_gaps(): void
    {
        $viewer = User::factory()->create();
        $posts = Post::factory()->count(25)->create(['status' => 'published']);

        $seenIds = [];
        $cursor = null;

        do {
            $response = $this->actingAs($viewer, 'sanctum')->getJson(
                '/api/feed?per_page=10'.($cursor ? '&cursor='.$cursor : '')
            );

            $response->assertOk();

            foreach ($response->json('data') as $item) {
                $seenIds[] = $item['id'];
            }

            $cursor = $response->json('meta.next_cursor');
            $hasMore = $response->json('meta.has_more');
        } while ($hasMore && $cursor !== null);

        $this->assertCount(25, $seenIds);
        $this->assertCount(25, array_unique($seenIds));
        $this->assertEqualsCanonicalizing($posts->pluck('id')->all(), $seenIds);
    }

    public function test_feed_boosts_emerging_artist_with_high_engagement_over_established_author(): void
    {
        $viewer = User::factory()->create();

        $established = User::factory()->create();
        $emerging = User::factory()->create();

        $establishedFollowers = User::factory()->count(150)->create();
        DB::table('followers')->insert(
            $establishedFollowers->map(fn (User $f): array => [
                'follower_id' => $f->id,
                'followed_id' => $established->id,
                'created_at' => now(),
                'updated_at' => now(),
            ])->all()
        );

        $sameCreatedAt = now()->subHours(2);

        $establishedPost = Post::factory()->for($established)->create([
            'status' => 'published',
            'created_at' => $sameCreatedAt,
        ]);

        $emergingPost = Post::factory()->for($emerging)->create([
            'status' => 'published',
            'created_at' => $sameCreatedAt,
        ]);

        $likers = User::factory()->count(10)->create();
        foreach ($likers as $liker) {
            Like::factory()->create(['user_id' => $liker->id, 'post_id' => $emergingPost->id]);
        }

        $response = $this->actingAs($viewer, 'sanctum')->getJson('/api/feed?per_page=2');

        $orderedIds = collect($response->json('data'))->pluck('id')->all();

        $this->assertSame(
            [$emergingPost->id, $establishedPost->id],
            $orderedIds,
            'El post del artista emergente con más engagement debería rankear primero.'
        );
    }

    public function test_feed_dispatches_view_tracking_job_without_blocking_response(): void
    {
        Queue::fake();

        $viewer = User::factory()->create();
        $posts = Post::factory()->count(3)->create(['status' => 'published']);

        $this->actingAs($viewer, 'sanctum')->getJson('/api/feed')->assertOk();

        Queue::assertPushed(RecordPostViewsJob::class, function (RecordPostViewsJob $job) use ($posts, $viewer) {
            $reflection = new ReflectionClass($job);

            $postIdsProperty = $reflection->getProperty('postIds');
            $postIdsProperty->setAccessible(true);

            $viewerIdProperty = $reflection->getProperty('viewerId');
            $viewerIdProperty->setAccessible(true);

            return $viewerIdProperty->getValue($job) === $viewer->id
                && empty(array_diff($postIdsProperty->getValue($job), $posts->pluck('id')->all()));
        });
    }

    public function test_record_post_views_job_inserts_rows(): void
    {
        $viewer = User::factory()->create();
        $posts = Post::factory()->count(2)->create(['status' => 'published']);

        (new RecordPostViewsJob($posts->pluck('id')->all(), $viewer->id))->handle();

        foreach ($posts as $post) {
            $this->assertDatabaseHas('post_views', [
                'post_id' => $post->id,
                'user_id' => $viewer->id,
                'source' => 'feed',
            ]);
        }
    }

    public function test_record_post_views_job_inserts_rows_with_null_user_for_guest_viewer(): void
    {
        $posts = Post::factory()->count(2)->create(['status' => 'published']);

        (new RecordPostViewsJob($posts->pluck('id')->all(), null))->handle();

        foreach ($posts as $post) {
            $this->assertDatabaseHas('post_views', [
                'post_id' => $post->id,
                'user_id' => null,
                'source' => 'feed',
            ]);
        }
    }

    public function test_feed_dispatches_view_tracking_job_with_null_viewer_id_for_guest(): void
    {
        Queue::fake();

        $posts = Post::factory()->count(2)->create(['status' => 'published']);

        $this->getJson('/api/feed')->assertOk();

        Queue::assertPushed(RecordPostViewsJob::class, function (RecordPostViewsJob $job) {
            $reflection = new ReflectionClass($job);

            $viewerIdProperty = $reflection->getProperty('viewerId');
            $viewerIdProperty->setAccessible(true);

            return $viewerIdProperty->getValue($job) === null;
        });
    }
}
