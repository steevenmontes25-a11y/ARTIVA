<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('post_views')) {
            Schema::create('post_views', function (Blueprint $table) {
                $table->id();
                $table->foreignId('post_id')->constrained('posts')->cascadeOnDelete();
                // Nullable: si en el futuro se permite navegar el feed sin sesión.
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('source')->default('feed');
                // Sin updated_at: una "view" es un evento inmutable, no un registro editable.
                $table->timestamp('created_at')->useCurrent();

                $table->index(['post_id', 'created_at']);
                $table->index(['user_id', 'created_at']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('post_views');
    }
};
