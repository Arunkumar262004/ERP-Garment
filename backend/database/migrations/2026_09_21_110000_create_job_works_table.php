<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_works', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_process_id')->constrained('production_processes')->cascadeOnDelete();
            $table->string('job_worker_name');
            $table->string('job_worker_phone', 10)->nullable();
            $table->string('outward_dc_no')->nullable();
            $table->date('outward_date')->nullable();
            $table->decimal('outward_quantity', 14, 2)->nullable();
            $table->string('inward_dc_no')->nullable();
            $table->date('inward_date')->nullable();
            $table->decimal('inward_quantity', 14, 2)->nullable();
            $table->text('remarks')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_works');
    }
};
