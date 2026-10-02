<?php

namespace Tests\Feature;

use App\Domain\Auth\Models\ArtistProfile;
use App\Domain\Auth\Models\User;
use App\Domain\Collaborations\Models\CollaborationRequest;
use App\Domain\Feed\Models\Category;
use App\Domain\Messaging\Models\Conversation;
use App\Domain\Messaging\Models\Message;
use App\Domain\Moderation\Models\Block;
use App\Domain\Moderation\Models\Report;
use App\Domain\Notifications\Models\Notification;
use App\Domain\Posts\Models\Comment;
use App\Domain\Posts\Models\Hashtag;
use App\Domain\Posts\Models\Post;
use App\Domain\Posts\Models\PostMedia;
use App\Domain\Social\Models\Follow;
use App\Domain\Social\Models\Like;
use App\Domain\Social\Models\SavedPost;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ArtivaMvpSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_artist_profile_and_categories_relate_to_user(): void
    {
        $user = User::factory()->create();
        $category = Category::factory()->create();

        $artistProfile = ArtistProfile::factory()->for($user)->create();
        $user->categories()->attach($category);

        $this->assertTrue($user->fresh()->artistProfile->is($artistProfile));
        $this->assertTrue($user->categories->contains($category));
        $this->assertTrue($category->artists->contains($user));
    }

    public function test_post_with_media_hashtags_comments_and_likes(): void
    {
        $author = User::factory()->create();
        $category = Category::factory()->create();

        $post = Post::factory()->for($author)->for($category)->create();
        PostMedia::factory()->for($post)->create(['position' => 0]);
        PostMedia::factory()->for($post)->create(['position' => 1]);

        $hashtag = Hashtag::factory()->create();
        $post->hashtags()->attach($hashtag);

        $commenter = User::factory()->create();
        $comment = Comment::factory()->for($post)->for($commenter, 'user')->create();
        Comment::factory()->for($post)->for($author, 'user')->create(['parent_id' => $comment->id]);

        $liker = User::factory()->create();
        Like::factory()->for($liker, 'user')->for($post)->create();
        SavedPost::factory()->for($liker, 'user')->for($post)->create();

        $post->refresh();

        $this->assertCount(2, $post->media);
        $this->assertCount(1, $post->hashtags);
        $this->assertCount(2, $post->comments);
        $this->assertCount(1, $comment->replies);
        $this->assertTrue($post->likedBy->contains($liker));
        $this->assertTrue($post->savedBy->contains($liker));
    }

    public function test_duplicate_like_violates_unique_constraint(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->create();

        Like::factory()->for($user, 'user')->for($post)->create();

        $this->expectException(QueryException::class);

        Like::factory()->for($user, 'user')->for($post)->create();
    }

    public function test_followers_relation_between_two_users(): void
    {
        $follower = User::factory()->create();
        $followed = User::factory()->create();

        Follow::factory()->create([
            'follower_id' => $follower->id,
            'followed_id' => $followed->id,
        ]);

        $this->assertTrue($follower->following->contains($followed));
        $this->assertTrue($followed->followers->contains($follower));
    }

    public function test_collaboration_request_belongs_to_user_and_category(): void
    {
        $creator = User::factory()->create();
        $category = Category::factory()->create();

        $request = CollaborationRequest::factory()->for($creator)->for($category)->create();

        $this->assertTrue($request->user->is($creator));
        $this->assertTrue($request->category->is($category));
        $this->assertSame('abierto', $request->status);
    }

    public function test_conversation_with_participants_and_messages(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $conversation = Conversation::factory()->create();
        $conversation->participants()->attach([$userA->id, $userB->id]);

        Message::factory()->for($conversation)->create(['sender_id' => $userA->id]);

        $this->assertCount(2, $conversation->participants);
        $this->assertCount(1, $conversation->messages);
        $this->assertTrue($userA->conversations->contains($conversation));
    }

    public function test_notification_belongs_to_user(): void
    {
        $user = User::factory()->create();
        $notification = Notification::factory()->for($user)->create(['is_read' => false]);

        $this->assertTrue($notification->user->is($user));
        $this->assertFalse($notification->is_read);
    }

    public function test_report_is_polymorphic_and_block_prevents_duplicates(): void
    {
        $reporter = User::factory()->create();
        $post = Post::factory()->create();

        $report = Report::factory()->create([
            'reporter_id' => $reporter->id,
            'reportable_type' => Post::class,
            'reportable_id' => $post->id,
        ]);

        $this->assertTrue($report->reportable->is($post));

        $blocker = User::factory()->create();
        $blocked = User::factory()->create();

        Block::factory()->create([
            'blocker_id' => $blocker->id,
            'blocked_id' => $blocked->id,
        ]);

        $this->assertTrue($blocker->blockedUsers->contains($blocked));

        $this->expectException(QueryException::class);

        Block::factory()->create([
            'blocker_id' => $blocker->id,
            'blocked_id' => $blocked->id,
        ]);
    }
}
