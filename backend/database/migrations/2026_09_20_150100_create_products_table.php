<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('brand_id')->nullable()->constrained('brands')->nullOnDelete();
            $table->string('garment_type')->nullable();
            $table->string('category')->nullable();
            $table->string('hsn_code')->nullable();
            $table->text('description')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });

        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('size_id')->nullable()->constrained('sizes')->nullOnDelete();
            $table->string('color')->nullable();
            $table->string('sku')->unique();
            $table->decimal('stock_quantity', 14, 2)->default(0);
            $table->decimal('price', 14, 2)->default(0);
            $table->decimal('cost_price', 14, 2)->nullable();
            $table->foreignId('production_order_item_id')->nullable()->constrained('production_order_items')->nullOnDelete();
            $table->timestamps();

            $table->unique(['product_id', 'size_id', 'color']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('products');
    }
};
