<?php

namespace Tests\Feature\Posts;

use App\Domain\Auth\Models\User;
use App\Domain\Feed\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CreatePostTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_post_requires_authentication(): void
    {
        $this->postJson('/api/posts', ['type' => 'text', 'caption' => 'hola'])->assertUnauthorized();
    }

    public function test_creates_text_post_without_media(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/posts', [
            'type' => 'text',
            'caption' => 'Solo texto, sin media.',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.type', 'text')
            ->assertJsonPath('data.caption', 'Solo texto, sin media.')
            ->assertJsonCount(0, 'data.media');

        $this->assertDatabaseHas('posts', [
            'user_id' => $user->id,
            'type' => 'text',
            'status' => 'published',
        ]);
    }

    public function test_creates_image_post_and_stores_media_file(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $category = Category::factory()->create();

        $image = UploadedFile::fake()->image('artwork.jpg');

        $response = $this->actingAs($user, 'sanctum')->post('/api/posts', [
            'type' => 'image',
            'caption' => 'Mi última pieza',
            'category_id' => $category->id,
            'media' => $image,
        ]);

        $response->assertCreated()->assertJsonCount(1, 'data.media');

        $mediaUrl = $response->json('data.media.0.url');
        $this->assertNotNull($mediaUrl);

        $storedPath = str($mediaUrl)->after('/storage/')->toString();
        Storage::disk('public')->assertExists($storedPath);

        $this->assertDatabaseHas('post_media', ['type' => 'image']);
    }

    public function test_rejects_media_with_wrong_mimetype_for_declared_type(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $textFile = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

        $response = $this->actingAs($user, 'sanctum')->post('/api/posts', [
            'type' => 'video',
            'media' => $textFile,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['media']);
    }

    public function test_requires_media_for_non_text_types(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/posts', [
            'type' => 'image',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['media']);
    }

    public function test_rejects_unknown_category(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/posts', [
            'type' => 'text',
            'category_id' => 999999,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['category_id']);
    }

    public function test_hashtags_are_normalized_and_synced(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/posts', [
            'type' => 'text',
            'caption' => 'Arte urbano',
            'hashtags' => ['#Arte', 'arte', 'FOTOGRAFIA'],
        ]);

        $response->assertCreated();

        $tags = collect($response->json('data.hashtags'))->all();
        sort($tags);

        $this->assertSame(['arte', 'fotografia'], $tags);
        $this->assertDatabaseCount('hashtags', 2);
    }
}
