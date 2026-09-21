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
        Schema::table('production_order_items', function (Blueprint $table) {
            $table->decimal('dia', 6, 2)->nullable()->after('gsm');
            $table->string('counts', 30)->nullable()->after('dia');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('production_order_items', function (Blueprint $table) {
            $table->dropColumn(['dia', 'counts']);
        });
    }
};
