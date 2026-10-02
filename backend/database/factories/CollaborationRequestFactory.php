<?php

namespace Database\Factories;

use App\Domain\Auth\Models\User;
use App\Domain\Collaborations\Models\CollaborationRequest;
use App\Domain\Feed\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CollaborationRequest>
 */
class CollaborationRequestFactory extends Factory
{
    protected $model = CollaborationRequest::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'category_id' => Category::factory(),
            'required_discipline' => fake()->randomElement(['Música', 'Fotografía', 'Danza', 'Cine']),
            'location' => fake()->city(),
            'is_remote' => fake()->boolean(),
            'budget' => fake()->optional()->randomFloat(2, 50, 5000),
            'deadline' => fake()->optional()->dateTimeBetween('+1 week', '+3 months'),
            'participants_needed' => fake()->numberBetween(1, 5),
            'status' => 'abierto',
        ];
    }
}
