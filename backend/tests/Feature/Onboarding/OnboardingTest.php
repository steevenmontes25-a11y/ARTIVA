<?php

namespace Tests\Feature\Onboarding;

use App\Domain\Auth\Models\ArtistProfile;
use App\Domain\Auth\Models\User;
use App\Domain\Feed\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OnboardingTest extends TestCase
{
    use RefreshDatabase;

    public function test_categories_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/categories')->assertUnauthorized();
    }

    public function test_categories_endpoint_lists_all_categories(): void
    {
        Category::factory()->count(3)->create();
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/categories');

        $response->assertOk()->assertJsonCount(3, 'data');
    }

    public function test_onboarding_complete_requires_authentication(): void
    {
        $this->putJson('/api/onboarding/complete', ['category_ids' => [1]])->assertUnauthorized();
    }

    public function test_onboarding_complete_requires_at_least_one_category(): void
    {
        $user = User::factory()->create();
        ArtistProfile::factory()->for($user)->create();

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/onboarding/complete', [
            'category_ids' => [],
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['category_ids']);
    }

    public function test_onboarding_complete_rejects_unknown_category_ids(): void
    {
        $user = User::factory()->create();
        ArtistProfile::factory()->for($user)->create();

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/onboarding/complete', [
            'category_ids' => [999999],
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['category_ids.0']);
    }

    public function test_onboarding_complete_merges_categories_and_interests_updates_bio_and_marks_complete(): void
    {
        $user = User::factory()->create(['bio' => null]);
        ArtistProfile::factory()->for($user)->create(['onboarding_completed' => false]);

        $artistType = Category::factory()->create();
        $sharedCategory = Category::factory()->create();
        $interestOnly = Category::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/onboarding/complete', [
            'category_ids' => [$artistType->id, $sharedCategory->id],
            'interest_ids' => [$sharedCategory->id, $interestOnly->id],
            'bio' => 'Fotógrafa y pintora.',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.onboarding_completed', true)
            ->assertJsonPath('data.bio', 'Fotógrafa y pintora.');

        $user->refresh();

        $this->assertSame('Fotógrafa y pintora.', $user->bio);
        $this->assertTrue($user->artistProfile->onboarding_completed);
        $this->assertCount(3, $user->categories);
        $this->assertTrue($user->categories->pluck('id')->contains($artistType->id));
        $this->assertTrue($user->categories->pluck('id')->contains($sharedCategory->id));
        $this->assertTrue($user->categories->pluck('id')->contains($interestOnly->id));
    }

    public function test_onboarding_complete_is_safe_to_resubmit_and_replaces_previous_categories(): void
    {
        $user = User::factory()->create();
        ArtistProfile::factory()->for($user)->create();

        $firstBatch = Category::factory()->count(2)->create();
        $secondBatch = Category::factory()->count(2)->create();

        $this->actingAs($user, 'sanctum')->putJson('/api/onboarding/complete', [
            'category_ids' => $firstBatch->pluck('id')->all(),
        ])->assertOk();

        $this->actingAs($user, 'sanctum')->putJson('/api/onboarding/complete', [
            'category_ids' => $secondBatch->pluck('id')->all(),
        ])->assertOk();

        $user->refresh();

        $this->assertCount(2, $user->categories);
        $this->assertEqualsCanonicalizing(
            $secondBatch->pluck('id')->all(),
            $user->categories->pluck('id')->all(),
        );
    }
}
