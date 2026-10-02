<?php

namespace Database\Factories;

use App\Domain\Posts\Models\Post;
use App\Domain\Posts\Models\PostMedia;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PostMedia>
 */
class PostMediaFactory extends Factory
{
    protected $model = PostMedia::class;

    /**
     * Assets públicos de prueba, verificados manualmente como accesibles
     * (fake()->imageUrl() apuntaba a via.placeholder.com, que ya no
     * resuelve DNS — y la URL no coincidía con el $type de todas formas).
     */
    private const VIDEO_URLS = [
        'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        'https://flutter.github.io/assets-for-api-docs/assets/videos/butterfly.mp4',
        'https://flutter.github.io/assets-for-api-docs/assets/videos/bee.mp4',
    ];

    private const AUDIO_URLS = [
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    ];

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $type = fake()->randomElement(['video', 'image', 'audio']);

        return [
            'post_id' => Post::factory(),
            'url' => match ($type) {
                'video' => fake()->randomElement(self::VIDEO_URLS),
                'audio' => fake()->randomElement(self::AUDIO_URLS),
                default => 'https://picsum.photos/seed/'.fake()->uuid().'/720/1280',
            },
            'type' => $type,
            'position' => 0,
            'duration_seconds' => $type === 'image' ? null : fake()->numberBetween(5, 180),
        ];
    }
}
