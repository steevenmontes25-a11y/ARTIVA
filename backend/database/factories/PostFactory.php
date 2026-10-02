<?php

namespace Database\Factories;

use App\Domain\Auth\Models\User;
use App\Domain\Feed\Models\Category;
use App\Domain\Posts\Models\Post;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Post>
 */
class PostFactory extends Factory
{
    protected $model = Post::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'type' => fake()->randomElement(['video', 'image', 'audio', 'text']),
            'caption' => fake()->optional()->sentence(),
            'category_id' => Category::factory(),
            'status' => 'published',
        ];
    }
}
