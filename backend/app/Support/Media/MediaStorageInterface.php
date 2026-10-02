<?php

namespace App\Support\Media;

use Illuminate\Http\UploadedFile;

/**
 * Capa abstracta de storage para archivos de media (avatares, media de
 * posts). Local en dev (LocalMediaStorage); cloud-ready — para pasar a S3
 * u otro proveedor solo hace falta una nueva implementación + cambiar el
 * binding en AppServiceProvider, sin tocar los call sites.
 */
interface MediaStorageInterface
{
    /**
     * Guarda el archivo en el directorio dado y devuelve la URL pública
     * para acceder a él.
     */
    public function store(UploadedFile $file, string $directory): string;

    /**
     * Borra un archivo previamente almacenado, dada su URL pública.
     * No-op si la URL no corresponde a un archivo gestionado por este disco.
     */
    public function delete(string $url): void;
}
