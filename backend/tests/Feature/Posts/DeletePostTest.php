<?php

namespace Tests\Feature\Posts;

use App\Domain\Auth\Models\User;
use App\Domain\Posts\Models\Comment;
use App\Domain\Posts\Models\Post;
use App\Domain\Posts\Models\PostMedia;
use App\Domain\Social\Models\Like;
use App\Domain\Social\Models\SavedPost;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DeletePostTest extends TestCase
{
    use RefreshDatabase;

    public function test_delete_requires_authentication(): void
    {
        $post = Post::factory()->create();

        $this->deleteJson("/api/posts/{$post->id}")->assertUnauthorized();
    }

    public function test_only_the_author_can_delete_their_post(): void
    {
        $author = User::factory()->create();
        $someoneElse = User::factory()->create();
        $post = Post::factory()->for($author)->create();

        $response = $this->actingAs($someoneElse, 'sanctum')->deleteJson("/api/posts/{$post->id}");

        $response->assertForbidden();
        $this->assertDatabaseHas('posts', ['id' => $post->id]);
    }

    public function test_author_can_delete_own_post_and_related_rows_cascade(): void
    {
        $author = User::factory()->create();
        $post = Post::factory()->for($author)->create();
        PostMedia::factory()->for($post)->create();

        $liker = User::factory()->create();
        Like::factory()->create(['user_id' => $liker->id, 'post_id' => $post->id]);
        SavedPost::factory()->create(['user_id' => $liker->id, 'post_id' => $post->id]);
        Comment::factory()->for($post)->for($liker, 'user')->create();

        $response = $this->actingAs($author, 'sanctum')->deleteJson("/api/posts/{$post->id}");

        $response->assertOk();

        $this->assertDatabaseMissing('posts', ['id' => $post->id]);
        $this->assertDatabaseMissing('post_media', ['post_id' => $post->id]);
        $this->assertDatabaseMissing('likes', ['post_id' => $post->id]);
        $this->assertDatabaseMissing('saved_posts', ['post_id' => $post->id]);
        $this->assertDatabaseMissing('comments', ['post_id' => $post->id]);
    }

    public function test_deleting_post_removes_the_physical_media_file(): void
    {
        Storage::fake('public');
        $author = User::factory()->create();

        $image = UploadedFile::fake()->image('artwork.jpg');

        $createResponse = $this->actingAs($author, 'sanctum')->post('/api/posts', [
            'type' => 'image',
            'media' => $image,
        ]);

        $mediaUrl = $createResponse->json('data.media.0.url');
        $storedPath = str($mediaUrl)->after('/storage/')->toString();
        Storage::disk('public')->assertExists($storedPath);

        $postId = $createResponse->json('data.id');

        $this->actingAs($author, 'sanctum')->deleteJson("/api/posts/{$postId}")->assertOk();

        Storage::disk('public')->assertMissing($storedPath);
    }
}
