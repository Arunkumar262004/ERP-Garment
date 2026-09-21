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
        Schema::table('contacts', function (Blueprint $table) {
            // Which production stage this person leads — set for type=employee so they
            // can be offered as the "Assigned Employee" when a process reaches that stage.
            $table->enum('category', ['cutting', 'dyeing', 'stitching', 'printing', 'packing', 'quality_check', 'other'])
                ->nullable()
                ->after('department');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->dropColumn('category');
        });
    }
};
