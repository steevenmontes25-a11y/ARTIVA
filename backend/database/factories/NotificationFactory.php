<?php

namespace Database\Factories;

use App\Domain\Auth\Models\User;
use App\Domain\Notifications\Models\Notification;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Notification>
 */
class NotificationFactory extends Factory
{
    protected $model = Notification::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'type' => fake()->randomElement(['like', 'comment', 'follow', 'collaboration_request']),
            'data' => ['message' => fake()->sentence()],
            'is_read' => false,
        ];
    }
}
