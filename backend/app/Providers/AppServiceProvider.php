<?php

namespace App\Providers;

use App\Support\Media\LocalMediaStorage;
use App\Support\Media\MediaStorageInterface;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Local en dev; swap a una implementación cloud (S3, etc.) sin
        // tocar los call sites cuando haga falta.
        $this->app->bind(MediaStorageInterface::class, LocalMediaStorage::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Los modelos viven en app/Domain/{Dominio}/Models, no en app/Models,
        // así que la convención por defecto de Laravel (que espeja el
        // sub-namespace del modelo dentro de database/factories) no aplica.
        // Todas las factories son planas en database/factories/{Modelo}Factory.
        Factory::guessFactoryNamesUsing(
            fn (string $modelName) => 'Database\\Factories\\'.class_basename($modelName).'Factory',
        );
    }
}
