<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('production_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_no')->nullable()->unique();
            $table->foreignId('contact_id')->constrained('contacts')->cascadeOnDelete();
            $table->foreignId('quotation_id')->nullable()->constrained('quotations')->nullOnDelete();
            $table->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->date('order_date');
            $table->date('expected_delivery_date')->nullable();
            $table->enum('status', ['pending', 'in_production', 'completed', 'delivered', 'cancelled'])->default('pending');
            $table->decimal('total_quantity', 14, 2)->default(0);
            $table->foreignId('brand_id')->nullable()->constrained('brands')->nullOnDelete();
            $table->enum('order_type', ['own', 'others'])->default('own');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('production_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_order_id')->constrained('production_orders')->cascadeOnDelete();
            $table->string('item_name');
            $table->text('description')->nullable();
            $table->decimal('quantity', 14, 2)->default(1);
            $table->string('unit')->nullable();
            $table->string('sku')->nullable()->unique();
            $table->string('garment_type')->nullable();
            $table->unsignedInteger('gsm')->nullable();
            $table->decimal('cutting_weight_kg', 10, 2)->nullable();
            $table->foreignId('size_id')->nullable()->constrained('sizes')->nullOnDelete();
            $table->string('color')->nullable();
            $table->string('hsn_code')->nullable();
            $table->text('details')->nullable();
            $table->timestamps();
        });

        Schema::create('production_processes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_order_id')->constrained('production_orders')->cascadeOnDelete();
            $table->enum('process_type', ['cutting', 'dyeing', 'stitching', 'printing', 'packing', 'quality_check', 'other'])->index();
            $table->unsignedInteger('sequence')->default(1);
            $table->enum('status', ['pending', 'in_progress', 'completed', 'skipped'])->default('pending');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('quantity_completed', 14, 2)->default(0);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_processes');
        Schema::dropIfExists('production_order_items');
        Schema::dropIfExists('production_orders');
    }
};
