<?php

namespace Database\Factories;

use App\Domain\Auth\Models\ArtistProfile;
use App\Domain\Auth\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ArtistProfile>
 */
class ArtistProfileFactory extends Factory
{
    protected $model = ArtistProfile::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'primary_discipline' => fake()->randomElement([
                'Música', 'Fotografía', 'Ilustración', 'Pintura', 'Danza', 'Cine',
            ]),
            'specialties' => fake()->randomElements([
                'Retrato', 'Paisaje', 'Composición', 'Edición', 'Dirección', 'Guion',
            ], fake()->numberBetween(1, 3)),
            'location' => fake()->city(),
            'external_links' => [
                'website' => fake()->optional()->url(),
                'instagram' => fake()->optional()->userName(),
            ],
        ];
    }
}
