<?php

namespace App\Domain\Posts\Actions;

use App\Domain\Auth\Models\User;
use App\Domain\Posts\Models\Hashtag;
use App\Domain\Posts\Models\Post;
use App\Domain\Posts\Models\PostMedia;
use App\Support\Media\MediaStorageInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreatePostAction
{
    public function __construct(private readonly MediaStorageInterface $storage) {}

    /**
     * Crea el post, su media (si aplica) y sincroniza hashtags, todo en
     * una transacción porque toca posts + post_media + hashtags +
     * post_hashtags a la vez.
     *
     * @param  array{type: string, caption?: ?string, category_id?: ?int, hashtags?: array<int, string>}  $data
     */
    public function execute(User $user, array $data, ?UploadedFile $mediaFile): Post
    {
        return DB::transaction(function () use ($user, $data, $mediaFile): Post {
            $post = Post::create([
                'user_id' => $user->id,
                'type' => $data['type'],
                'caption' => $data['caption'] ?? null,
                'category_id' => $data['category_id'] ?? null,
                'status' => 'published',
            ]);

            if ($mediaFile) {
                $url = $this->storage->store($mediaFile, "posts/{$post->id}");

                PostMedia::create([
                    'post_id' => $post->id,
                    'url' => $url,
                    'type' => $data['type'],
                    'position' => 0,
                ]);
            }

            if (! empty($data['hashtags'])) {
                $this->syncHashtags($post, $data['hashtags']);
            }

            return $post->fresh(['media', 'category', 'hashtags', 'user.artistProfile']);
        });
    }

    /**
     * @param  array<int, string>  $tags
     */
    private function syncHashtags(Post $post, array $tags): void
    {
        $hashtagIds = collect($tags)
            ->map(fn (string $tag): string => $this->normalizeHashtag($tag))
            ->filter()
            ->unique()
            ->map(fn (string $tag): int => Hashtag::firstOrCreate(['tag' => $tag])->id);

        $post->hashtags()->sync($hashtagIds);
    }

    private function normalizeHashtag(string $tag): string
    {
        return Str::lower(ltrim(trim($tag), '#'));
    }
}
