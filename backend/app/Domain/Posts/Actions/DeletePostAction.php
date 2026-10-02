<?php

namespace App\Domain\Posts\Actions;

use App\Domain\Posts\Models\Post;
use App\Support\Media\MediaStorageInterface;
use Illuminate\Support\Facades\DB;

class DeletePostAction
{
    public function __construct(private readonly MediaStorageInterface $storage) {}

    /**
     * Borra el post dentro de una transacción (la fila en sí; likes,
     * comments, post_media, post_hashtags y saved_posts caen en cascada
     * vía FK). Los archivos físicos de media se borran DESPUÉS de que el
     * commit de la transacción sea exitoso: borrar archivos no es
     * transaccional, así que si la transacción fallara y se hiciera
     * rollback, no queremos haber borrado ya el archivo del disco.
     */
    public function execute(Post $post): void
    {
        $mediaUrls = $post->media->pluck('url')->all();

        DB::transaction(function () use ($post): void {
            $post->delete();
        });

        foreach ($mediaUrls as $url) {
            $this->storage->delete($url);
        }
    }
}
