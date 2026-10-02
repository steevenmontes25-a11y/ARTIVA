<?php

namespace Tests\Feature\Social;

use App\Domain\Auth\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FollowTest extends TestCase
{
    use RefreshDatabase;

    public function test_follow_requires_authentication(): void
    {
        $artist = User::factory()->create();

        $this->postJson("/api/artists/{$artist->username}/follow")->assertUnauthorized();
    }

    public function test_toggle_follow_creates_then_removes_the_follow(): void
    {
        $viewer = User::factory()->create();
        $artist = User::factory()->create();

        $first = $this->actingAs($viewer, 'sanctum')->postJson("/api/artists/{$artist->username}/follow");
        $first->assertOk()->assertJson(['following' => true, 'followers_count' => 1]);
        $this->assertDatabaseHas('followers', ['follower_id' => $viewer->id, 'followed_id' => $artist->id]);

        $second = $this->actingAs($viewer, 'sanctum')->postJson("/api/artists/{$artist->username}/follow");
        $second->assertOk()->assertJson(['following' => false, 'followers_count' => 0]);
        $this->assertDatabaseMissing('followers', ['follower_id' => $viewer->id, 'followed_id' => $artist->id]);
    }

    public function test_cannot_follow_yourself(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/artists/{$user->username}/follow");

        $response->assertStatus(422);
        $this->assertDatabaseMissing('followers', ['follower_id' => $user->id, 'followed_id' => $user->id]);
    }
}
