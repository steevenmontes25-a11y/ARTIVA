<?php

namespace Database\Factories;

use App\Domain\Auth\Models\User;
use App\Domain\Moderation\Models\Report;
use App\Domain\Posts\Models\Post;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Report>
 */
class ReportFactory extends Factory
{
    protected $model = Report::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'reporter_id' => User::factory(),
            'reportable_type' => Post::class,
            'reportable_id' => Post::factory(),
            'reason' => fake()->randomElement(['spam', 'contenido_inapropiado', 'acoso', 'suplantacion']),
            'description' => fake()->optional()->paragraph(),
            'status' => 'pending',
        ];
    }
}
