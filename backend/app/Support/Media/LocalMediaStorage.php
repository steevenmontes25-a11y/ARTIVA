<?php

namespace App\Support\Media;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Implementación local (disco "public", servido vía el symlink de
 * storage:link) de MediaStorageInterface. Es la usada en dev; en
 * producción basta con bindear una implementación cloud (S3, etc.)
 * al mismo contrato.
 */
class LocalMediaStorage implements MediaStorageInterface
{
    private const DISK = 'public';

    public function store(UploadedFile $file, string $directory): string
    {
        $path = $file->store($directory, self::DISK);

        return Storage::disk(self::DISK)->url($path);
    }

    public function delete(string $url): void
    {
        $path = $this->extractStoredPath($url);

        if ($path !== null) {
            Storage::disk(self::DISK)->delete($path);
        }
    }

    private function extractStoredPath(string $url): ?string
    {
        if (! str_contains($url, '/storage/')) {
            return null;
        }

        return Str::after($url, '/storage/');
    }
}
