<?php

namespace App\Domain\Posts\Actions;

use App\Domain\Auth\Models\User;
use App\Domain\Posts\Models\Comment;
use App\Domain\Posts\Models\Post;

class CreateCommentAction
{
    /**
     * @param  array{content: string, parent_id?: ?int}  $data
     */
    public function execute(User $user, Post $post, array $data): Comment
    {
        $comment = Comment::create([
            'post_id' => $post->id,
            'user_id' => $user->id,
            'parent_id' => $data['parent_id'] ?? null,
            'content' => $data['content'],
        ]);

        return $comment->fresh('user');
    }
}
