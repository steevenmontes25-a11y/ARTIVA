<?php

namespace Database\Seeders;

use App\Domain\Auth\Models\ArtistProfile;
use App\Domain\Auth\Models\User;
use App\Domain\Feed\Models\Category;
use App\Domain\Posts\Models\Comment;
use App\Domain\Posts\Models\Post;
use App\Domain\Posts\Models\PostMedia;
use App\Domain\Social\Models\Like;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Seeder de DESARROLLO para probar el feed (ranking por engagement,
 * paginación por cursor, boost de artistas emergentes).
 *
 * No se ejecuta automáticamente desde DatabaseSeeder — es contenido de
 * prueba, no datos de referencia reales. Correr manualmente con:
 *   php artisan db:seed --class=PostSeeder
 */
class PostSeeder extends Seeder
{
    public function run(): void
    {
        if (Category::count() === 0) {
            $this->call(CategorySeeder::class);
        }

        $categories = Category::all();

        $establishedAuthors = $this->createAuthorsWithFollowers(count: 2, followers: 130, categories: $categories);
        $emergingAuthors = $this->createAuthorsWithFollowers(count: 3, followers: 15, categories: $categories);

        $viewers = User::factory()->count(20)->create();

        foreach ($establishedAuthors->merge($emergingAuthors) as $author) {
            $postCount = random_int(3, 6);

            for ($i = 0; $i < $postCount; $i++) {
                $post = Post::factory()->for($author)->create([
                    'category_id' => $categories->random()->id,
                    'status' => 'published',
                    'created_at' => now()->subHours(random_int(1, 200)),
                ]);

                PostMedia::factory()->for($post)->create(['position' => 0]);

                $likers = $viewers->random(min($viewers->count(), random_int(0, 18)));

                foreach ($likers as $liker) {
                    Like::factory()->create(['user_id' => $liker->id, 'post_id' => $post->id]);
                }

                if (random_int(0, 1) === 1) {
                    Comment::factory()->for($post)->for($viewers->random(), 'user')->create();
                }
            }
        }

        $this->command?->info('PostSeeder: posts de prueba creados para el feed.');
    }

    /**
     * @return Collection<int, User>
     */
    private function createAuthorsWithFollowers(int $count, int $followers, Collection $categories): Collection
    {
        $authors = User::factory()->count($count)->create();

        foreach ($authors as $author) {
            ArtistProfile::factory()->for($author)->create([
                'primary_discipline' => $categories->random()->name,
                'onboarding_completed' => true,
            ]);

            $followerUsers = User::factory()->count($followers)->create();

            DB::table('followers')->insert(
                $followerUsers->map(fn (User $follower): array => [
                    'follower_id' => $follower->id,
                    'followed_id' => $author->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ])->all()
            );
        }

        return $authors;
    }
}
