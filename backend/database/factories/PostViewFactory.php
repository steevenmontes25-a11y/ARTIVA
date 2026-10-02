<?php

namespace Database\Factories;

use App\Domain\Auth\Models\User;
use App\Domain\Posts\Models\Post;
use App\Domain\Posts\Models\PostView;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PostView>
 */
class PostViewFactory extends Factory
{
    protected $model = PostView::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'post_id' => Post::factory(),
            'user_id' => User::factory(),
            'source' => 'feed',
            'created_at' => now(),
        ];
    }
}
