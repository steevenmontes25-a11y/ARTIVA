<?php

namespace Tests\Feature\Profile;

use App\Domain\Auth\Models\ArtistProfile;
use App\Domain\Auth\Models\User;
use App\Domain\Collaborations\Models\CollaborationRequest;
use App\Domain\Posts\Models\Post;
use App\Domain\Posts\Models\PostMedia;
use App\Domain\Social\Models\Follow;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ArtistProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_show_is_accessible_without_authentication(): void
    {
        $artist = User::factory()->create();
        Follow::factory()->create(['followed_id' => $artist->id]);

        $response = $this->getJson("/api/artists/{$artist->username}");

        $response->assertOk()
            ->assertJsonPath('data.username', $artist->username)
            ->assertJsonPath('data.counts.followers', 1)
            ->assertJsonPath('data.is_following', false);
    }

    public function test_show_returns_404_for_unknown_username(): void
    {
        $viewer = User::factory()->create();

        $this->actingAs($viewer, 'sanctum')
            ->getJson('/api/artists/nadie-existe-con-este-username')
            ->assertNotFound();
    }

    public function test_show_returns_profile_with_counts_and_is_following(): void
    {
        $viewer = User::factory()->create();
        $artist = User::factory()->create();
        ArtistProfile::factory()->for($artist)->create([
            'primary_discipline' => 'Fotografía',
            'location' => 'Lima, Perú',
        ]);

        Post::factory()->for($artist)->create(['status' => 'published']);
        Post::factory()->for($artist)->create(['status' => 'published']);
        Post::factory()->for($artist)->create(['status' => 'draft']); // no debe contar

        $followers = User::factory()->count(3)->create();
        foreach ($followers as $follower) {
            Follow::factory()->create(['follower_id' => $follower->id, 'followed_id' => $artist->id]);
        }

        Follow::factory()->create(['follower_id' => $artist->id, 'followed_id' => $followers[0]->id]);

        Follow::factory()->create(['follower_id' => $viewer->id, 'followed_id' => $artist->id]);

        CollaborationRequest::factory()->for($artist)->count(2)->create();

        $response = $this->actingAs($viewer, 'sanctum')->getJson("/api/artists/{$artist->username}");

        $response->assertOk()
            ->assertJsonPath('data.username', $artist->username)
            ->assertJsonPath('data.primary_discipline', 'Fotografía')
            ->assertJsonPath('data.counts.followers', 4)
            ->assertJsonPath('data.counts.following', 1)
            ->assertJsonPath('data.counts.posts', 2)
            ->assertJsonPath('data.counts.collaborations', 2)
            ->assertJsonPath('data.counts.projects', 0)
            ->assertJsonPath('data.is_following', true);
    }

    public function test_show_is_following_false_when_viewer_does_not_follow(): void
    {
        $viewer = User::factory()->create();
        $artist = User::factory()->create();

        $response = $this->actingAs($viewer, 'sanctum')->getJson("/api/artists/{$artist->username}");

        $response->assertOk()->assertJsonPath('data.is_following', false);
    }

    public function test_posts_grid_is_accessible_without_authentication(): void
    {
        $artist = User::factory()->create();
        $post = Post::factory()->for($artist)->create(['status' => 'published']);
        PostMedia::factory()->for($post)->create();

        $this->getJson("/api/artists/{$artist->username}/posts")
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_posts_grid_paginates_and_excludes_non_published(): void
    {
        $viewer = User::factory()->create();
        $artist = User::factory()->create();

        $posts = Post::factory()->count(5)->for($artist)->create(['status' => 'published']);
        foreach ($posts as $post) {
            PostMedia::factory()->for($post)->create();
        }

        Post::factory()->for($artist)->create(['status' => 'draft']);

        $response = $this->actingAs($viewer, 'sanctum')
            ->getJson("/api/artists/{$artist->username}/posts?per_page=3");

        $response->assertOk()->assertJsonCount(3, 'data')->assertJsonPath('meta.has_more', true);

        $response->assertJsonStructure([
            'data' => ['*' => ['id', 'thumbnail_url', 'media_type', 'likes_count', 'comments_count']],
            'meta' => ['next_cursor', 'has_more'],
        ]);

        $cursor = $response->json('meta.next_cursor');

        $second = $this->actingAs($viewer, 'sanctum')
            ->getJson("/api/artists/{$artist->username}/posts?per_page=3&cursor={$cursor}");

        $second->assertOk()->assertJsonCount(2, 'data')->assertJsonPath('meta.has_more', false);
    }
}
