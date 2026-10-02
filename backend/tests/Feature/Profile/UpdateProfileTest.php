<?php

namespace Tests\Feature\Profile;

use App\Domain\Auth\Models\ArtistProfile;
use App\Domain\Auth\Models\User;
use App\Domain\Feed\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UpdateProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_update_requires_authentication(): void
    {
        $this->putJson('/api/profile', ['bio' => 'hola'])->assertUnauthorized();
    }

    public function test_partial_update_only_touches_provided_fields(): void
    {
        $user = User::factory()->create(['bio' => 'bio original']);
        ArtistProfile::factory()->for($user)->create(['location' => 'Bogotá, Colombia']);

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/profile', [
            'bio' => 'bio nueva',
        ]);

        $response->assertOk()->assertJsonPath('data.bio', 'bio nueva');

        $user->refresh();
        $this->assertSame('bio nueva', $user->bio);
        $this->assertSame('Bogotá, Colombia', $user->artistProfile->location);
    }

    public function test_update_syncs_categories(): void
    {
        $user = User::factory()->create();
        ArtistProfile::factory()->for($user)->create();

        $categoryA = Category::factory()->create();
        $categoryB = Category::factory()->create();
        $categoryC = Category::factory()->create();

        $user->categories()->attach([$categoryA->id, $categoryB->id]);

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/profile', [
            'category_ids' => [$categoryB->id, $categoryC->id],
        ]);

        $response->assertOk();

        $user->refresh();
        $this->assertEqualsCanonicalizing(
            [$categoryB->id, $categoryC->id],
            $user->categories->pluck('id')->all(),
        );
    }

    public function test_update_rejects_unknown_category_ids(): void
    {
        $user = User::factory()->create();
        ArtistProfile::factory()->for($user)->create();

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/profile', [
            'category_ids' => [999999],
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['category_ids.0']);
    }

    public function test_update_uploads_avatar_and_replaces_previous_file(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        ArtistProfile::factory()->for($user)->create();

        $firstAvatar = UploadedFile::fake()->image('avatar1.jpg');

        $firstResponse = $this->actingAs($user, 'sanctum')->put('/api/profile', [
            'avatar' => $firstAvatar,
        ]);

        $firstResponse->assertOk();
        $user->refresh();

        $this->assertNotNull($user->avatar_url);
        $firstPath = str($user->avatar_url)->after('/storage/')->toString();
        Storage::disk('public')->assertExists($firstPath);

        $secondAvatar = UploadedFile::fake()->image('avatar2.jpg');

        $secondResponse = $this->actingAs($user, 'sanctum')->put('/api/profile', [
            'avatar' => $secondAvatar,
        ]);

        $secondResponse->assertOk();
        $user->refresh();

        $secondPath = str($user->avatar_url)->after('/storage/')->toString();

        $this->assertNotSame($firstPath, $secondPath);
        Storage::disk('public')->assertExists($secondPath);
        Storage::disk('public')->assertMissing($firstPath);
    }

    public function test_update_rejects_non_image_avatar(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        ArtistProfile::factory()->for($user)->create();

        $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

        $response = $this->actingAs($user, 'sanctum')->put('/api/profile', [
            'avatar' => $file,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['avatar']);
    }

    public function test_update_saves_external_links_and_location(): void
    {
        $user = User::factory()->create();
        ArtistProfile::factory()->for($user)->create();

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/profile', [
            'location' => 'Ciudad de México, México',
            'external_links' => [
                'website' => 'https://example-artist.com',
                'instagram' => 'artista.ejemplo',
            ],
        ]);

        $response->assertOk();

        $user->refresh();
        $this->assertSame('Ciudad de México, México', $user->artistProfile->location);
        $this->assertSame('https://example-artist.com', $user->artistProfile->external_links['website']);
        $this->assertSame('artista.ejemplo', $user->artistProfile->external_links['instagram']);
    }
}
