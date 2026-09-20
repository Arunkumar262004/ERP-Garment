<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quotation_items', function (Blueprint $table) {
            $table->decimal('discount', 14, 2)->default(0)->after('unit_price');
        });

        Schema::table('invoice_items', function (Blueprint $table) {
            $table->decimal('discount', 14, 2)->default(0)->after('unit_price');
        });
    }

    public function down(): void
    {
        Schema::table('quotation_items', function (Blueprint $table) {
            $table->dropColumn('discount');
        });

        Schema::table('invoice_items', function (Blueprint $table) {
            $table->dropColumn('discount');
        });
    }
};
