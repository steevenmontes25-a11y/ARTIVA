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
        if (! Schema::hasTable('posts')) {
            Schema::create('posts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->enum('type', ['video', 'image', 'audio', 'text']);
                $table->text('caption')->nullable();
                $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
                // Valores esperados: draft, published, hidden, removed (Moderation).
                // String en vez de enum porque el spec no cerró la lista de valores.
                $table->string('status')->default('published');
                $table->timestamps();

                $table->index(['status', 'created_at']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
