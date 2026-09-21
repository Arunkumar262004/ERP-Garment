<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The generic outward/inward paperwork fields (job worker, DC no, date, qty)
 * aren't enough on their own — different stages hand off different real
 * fabric data: Knitting cares about yarn counts/name/colour, while Dyeing,
 * Compacting and Printing care about the fabric itself (item, GSM, counts,
 * tube diameter, colour, fabric SKU). All nullable — which ones apply is a
 * frontend-per-stage decision, not a DB constraint.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_works', function (Blueprint $table) {
            $table->string('counts')->nullable()->after('job_worker_phone');
            $table->string('yarn_name')->nullable()->after('counts');
            $table->string('colour')->nullable()->after('yarn_name');
            $table->string('item_name')->nullable()->after('colour');
            $table->integer('gsm')->nullable()->after('item_name');
            $table->decimal('dia', 8, 2)->nullable()->after('gsm');
            $table->string('fabric_sku')->nullable()->after('dia');
        });
    }

    public function down(): void
    {
        Schema::table('job_works', function (Blueprint $table) {
            $table->dropColumn(['counts', 'yarn_name', 'colour', 'item_name', 'gsm', 'dia', 'fabric_sku']);
        });
    }
};
