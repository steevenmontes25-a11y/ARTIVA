<?php

namespace Database\Seeders;

use App\Domain\Feed\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    /**
     * Disciplinas iniciales de ARTIVA. El seeder es idempotente: puede
     * correr varias veces sin duplicar filas (upsert por slug).
     */
    private const CATEGORIES = [
        'Música',
        'Canto',
        'Producción musical',
        'Fotografía',
        'Cine',
        'Video',
        'Ilustración',
        'Pintura',
        'Diseño gráfico',
        'Diseño 3D',
        'Animación',
        'Danza',
        'Teatro',
        'Actuación',
        'Escritura',
        'Poesía',
        'Arquitectura',
        'Arte digital',
        'Videojuegos',
        'Escultura',
        'Otras',
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (self::CATEGORIES as $name) {
            Category::updateOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name],
            );
        }
    }
}
