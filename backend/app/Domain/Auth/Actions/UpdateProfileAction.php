<?php

namespace App\Domain\Auth\Actions;

use App\Domain\Auth\Models\User;
use App\Support\Media\MediaStorageInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class UpdateProfileAction
{
    public function __construct(private readonly MediaStorageInterface $storage) {}

    /**
     * Actualiza bio/avatar (users) y ubicación/links/especialidades
     * (artist_profiles + artist_categories) en una sola transacción, ya
     * que toca varias tablas a la vez. Solo aplica los campos que
     * efectivamente vinieron en $data (actualización parcial).
     *
     * @param  array{bio?: ?string, category_ids?: array<int, int>, location?: ?string, external_links?: ?array<string, ?string>}  $data
     */
    public function execute(User $user, array $data, ?UploadedFile $avatarFile): User
    {
        return DB::transaction(function () use ($user, $data, $avatarFile): User {
            if (array_key_exists('bio', $data)) {
                $user->update(['bio' => $data['bio']]);
            }

            if ($avatarFile) {
                $this->replaceAvatar($user, $avatarFile);
            }

            $profileAttributes = [];

            if (array_key_exists('location', $data)) {
                $profileAttributes['location'] = $data['location'];
            }

            if (array_key_exists('external_links', $data)) {
                $profileAttributes['external_links'] = $data['external_links'];
            }

            if ($profileAttributes !== []) {
                $user->artistProfile()->update($profileAttributes);
            }

            if (array_key_exists('category_ids', $data)) {
                $user->categories()->sync($data['category_ids']);
            }

            return $user->fresh(['artistProfile', 'categories']);
        });
    }

    private function replaceAvatar(User $user, UploadedFile $file): void
    {
        $previousUrl = $user->avatar_url;

        $url = $this->storage->store($file, 'avatars');

        $user->update(['avatar_url' => $url]);

        if ($previousUrl !== null) {
            $this->storage->delete($previousUrl);
        }
    }
}
