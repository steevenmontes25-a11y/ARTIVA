<?php

namespace Tests\Feature\Posts;

use App\Domain\Auth\Models\User;
use App\Domain\Posts\Models\Comment;
use App\Domain\Posts\Models\Post;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommentTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_is_accessible_without_authentication_but_store_requires_it(): void
    {
        $post = Post::factory()->create();
        Comment::factory()->for($post)->create();

        $this->getJson("/api/posts/{$post->id}/comments")
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->postJson("/api/posts/{$post->id}/comments", ['content' => 'hola'])->assertUnauthorized();
    }

    public function test_creates_top_level_comment(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/posts/{$post->id}/comments", [
            'content' => 'Increíble trabajo!',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.content', 'Increíble trabajo!')
            ->assertJsonPath('data.parent_id', null)
            ->assertJsonPath('data.user.id', $user->id);

        $this->assertDatabaseHas('comments', [
            'post_id' => $post->id,
            'user_id' => $user->id,
            'parent_id' => null,
        ]);
    }

    public function test_creates_reply_with_parent_id(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->create();
        $parent = Comment::factory()->for($post)->create();

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/posts/{$post->id}/comments", [
            'content' => 'De acuerdo!',
            'parent_id' => $parent->id,
        ]);

        $response->assertCreated()->assertJsonPath('data.parent_id', $parent->id);
    }

    public function test_rejects_parent_id_from_a_different_post(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->create();
        $otherPost = Post::factory()->create();
        $parentFromOtherPost = Comment::factory()->for($otherPost)->create();

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/posts/{$post->id}/comments", [
            'content' => 'No debería poder responder acá',
            'parent_id' => $parentFromOtherPost->id,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['parent_id']);
    }

    public function test_index_returns_top_level_comments_with_nested_replies(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->create();

        $topLevel = Comment::factory()->for($post)->create(['content' => 'Comentario raíz']);
        Comment::factory()->for($post)->create(['content' => 'Respuesta 1', 'parent_id' => $topLevel->id]);
        Comment::factory()->for($post)->create(['content' => 'Respuesta 2', 'parent_id' => $topLevel->id]);

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/posts/{$post->id}/comments");

        $response->assertOk()->assertJsonCount(1, 'data')->assertJsonCount(2, 'data.0.replies');

        $response->assertJsonStructure([
            'data' => ['*' => ['id', 'content', 'parent_id', 'user', 'replies', 'created_at']],
            'meta' => ['current_page', 'last_page', 'per_page', 'total'],
        ]);
    }

    public function test_index_paginates(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->create();
        Comment::factory()->count(20)->for($post)->create();

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/posts/{$post->id}/comments?per_page=15");

        $response->assertOk()
            ->assertJsonCount(15, 'data')
            ->assertJsonPath('meta.total', 20)
            ->assertJsonPath('meta.last_page', 2);
    }
}
