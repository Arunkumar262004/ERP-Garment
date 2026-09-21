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
        Schema::create('production_process_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_process_id')->constrained('production_processes')->cascadeOnDelete();
            $table->foreignId('production_order_item_id')->constrained('production_order_items')->cascadeOnDelete();
            $table->timestamp('imported_at')->useCurrent();
            $table->timestamps();
            $table->unique(['production_process_id', 'production_order_item_id'], 'process_item_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_process_items');
    }
};
