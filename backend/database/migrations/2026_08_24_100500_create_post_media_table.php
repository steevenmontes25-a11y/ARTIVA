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
        if (! Schema::hasTable('post_media')) {
            Schema::create('post_media', function (Blueprint $table) {
                $table->id();
                $table->foreignId('post_id')->constrained('posts')->cascadeOnDelete();
                $table->string('url');
                $table->enum('type', ['video', 'image', 'audio']);
                // "position" en vez de "order" (palabra reservada en SQL).
                $table->unsignedInteger('position')->default(0);
                $table->unsignedInteger('duration_seconds')->nullable();
                $table->timestamps();

                $table->index(['post_id', 'position']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('post_media');
    }
};
