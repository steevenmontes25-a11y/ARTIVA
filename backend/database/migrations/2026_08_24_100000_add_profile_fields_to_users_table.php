<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'username')) {
                // Nullable + único a nivel de BD: usuarios existentes no tienen
                // username todavía (se backfillea abajo). La obligatoriedad real
                // ("único" y requerido para cuentas nuevas) se valida en la capa
                // de aplicación (Auth\Http\Requests) al registrar/editar perfil.
                $table->string('username')->nullable()->unique()->after('name');
            }

            if (! Schema::hasColumn('users', 'avatar_url')) {
                $table->string('avatar_url')->nullable()->after('email');
            }

            if (! Schema::hasColumn('users', 'bio')) {
                $table->text('bio')->nullable()->after('avatar_url');
            }
        });

        // Backfill de usuarios existentes sin username (p. ej. sembrados antes
        // de este módulo), usando el prefijo del email + id para garantizar unicidad.
        $usersWithoutUsername = DB::table('users')->whereNull('username')->orderBy('id')->get(['id', 'email']);

        foreach ($usersWithoutUsername as $user) {
            $base = Str::slug(Str::before($user->email, '@'), '_') ?: 'artista';

            DB::table('users')->where('id', $user->id)->update([
                'username' => "{$base}_{$user->id}",
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (['username', 'avatar_url', 'bio'] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
