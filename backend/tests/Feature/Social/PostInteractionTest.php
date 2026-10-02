<?php

namespace Tests\Feature\Social;

use App\Domain\Auth\Models\User;
use App\Domain\Posts\Models\Post;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PostInteractionTest extends TestCase
{
    use RefreshDatabase;

    public function test_like_and_save_require_authentication(): void
    {
        $post = Post::factory()->create();

        $this->postJson("/api/posts/{$post->id}/like")->assertUnauthorized();
        $this->deleteJson("/api/posts/{$post->id}/like")->assertUnauthorized();
        $this->postJson("/api/posts/{$post->id}/save")->assertUnauthorized();
        $this->deleteJson("/api/posts/{$post->id}/save")->assertUnauthorized();
    }

    public function test_like_then_unlike(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->create();

        $like = $this->actingAs($user, 'sanctum')->postJson("/api/posts/{$post->id}/like");
        $like->assertOk()->assertJson(['liked' => true, 'likes_count' => 1]);
        $this->assertDatabaseHas('likes', ['user_id' => $user->id, 'post_id' => $post->id]);

        $unlike = $this->actingAs($user, 'sanctum')->deleteJson("/api/posts/{$post->id}/like");
        $unlike->assertOk()->assertJson(['liked' => false, 'likes_count' => 0]);
        $this->assertDatabaseMissing('likes', ['user_id' => $user->id, 'post_id' => $post->id]);
    }

    public function test_liking_twice_does_not_duplicate_or_error(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->create();

        $this->actingAs($user, 'sanctum')->postJson("/api/posts/{$post->id}/like")->assertOk();
        $second = $this->actingAs($user, 'sanctum')->postJson("/api/posts/{$post->id}/like");

        $second->assertOk()->assertJson(['liked' => true, 'likes_count' => 1]);
    }

    public function test_unliking_when_not_liked_is_a_safe_no_op(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->deleteJson("/api/posts/{$post->id}/like");

        $response->assertOk()->assertJson(['liked' => false, 'likes_count' => 0]);
    }

    public function test_save_then_unsave(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->create();

        $save = $this->actingAs($user, 'sanctum')->postJson("/api/posts/{$post->id}/save");
        $save->assertOk()->assertJson(['saved' => true]);
        $this->assertDatabaseHas('saved_posts', ['user_id' => $user->id, 'post_id' => $post->id]);

        $unsave = $this->actingAs($user, 'sanctum')->deleteJson("/api/posts/{$post->id}/save");
        $unsave->assertOk()->assertJson(['saved' => false]);
        $this->assertDatabaseMissing('saved_posts', ['user_id' => $user->id, 'post_id' => $post->id]);
    }

    public function test_likes_count_reflects_multiple_users(): void
    {
        $post = Post::factory()->create();
        $likers = User::factory()->count(3)->create();

        foreach ($likers as $liker) {
            $this->actingAs($liker, 'sanctum')->postJson("/api/posts/{$post->id}/like")->assertOk();
        }

        $response = $this->actingAs(User::factory()->create(), 'sanctum')
            ->postJson("/api/posts/{$post->id}/like");

        $response->assertOk()->assertJson(['liked' => true, 'likes_count' => 4]);
    }
}
