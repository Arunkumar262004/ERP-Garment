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
        Schema::table('users', function (Blueprint $table) {
            // Which lead category this sales user handles best — used to
            // auto-route quick-captured leads to the least-loaded matching specialist.
            $table->enum('specialization', ['healthcare_erp', 'basic_crm', 'automation_crm', 'general'])
                ->nullable()
                ->after('role');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('specialization');
        });
    }
};
