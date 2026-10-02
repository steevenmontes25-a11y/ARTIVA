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
        if (! Schema::hasTable('collaboration_requests')) {
            Schema::create('collaboration_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('title');
                $table->text('description');
                $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
                $table->string('required_discipline')->nullable();
                $table->string('location')->nullable();
                $table->boolean('is_remote')->default(false);
                $table->decimal('budget', 10, 2)->nullable();
                $table->date('deadline')->nullable();
                $table->unsignedInteger('participants_needed')->default(1);
                $table->enum('status', ['abierto', 'en_revision', 'en_desarrollo', 'completado', 'cancelado'])
                    ->default('abierto');
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
        Schema::dropIfExists('collaboration_requests');
    }
};
