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
        Schema::table('artist_profiles', function (Blueprint $table) {
            if (! Schema::hasColumn('artist_profiles', 'onboarding_completed')) {
                $table->boolean('onboarding_completed')->default(false)->after('user_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('artist_profiles', function (Blueprint $table) {
            if (Schema::hasColumn('artist_profiles', 'onboarding_completed')) {
                $table->dropColumn('onboarding_completed');
            }
        });
    }
};
