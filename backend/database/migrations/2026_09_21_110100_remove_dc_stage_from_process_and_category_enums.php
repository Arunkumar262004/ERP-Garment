<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Removes the short-lived "dc" pipeline stage — it turned out to represent
 * job-work paperwork (outward/inward delivery challans when a stage is
 * subcontracted), not a fixed final stage. See create_job_works_table for
 * its replacement. Any existing "dc" process/category rows are from this
 * same round of development, not real production data, so they're simply
 * cleared rather than migrated to another value.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('production_processes')->where('process_type', 'dc')->delete();
        DB::table('contacts')->where('category', 'dc')->update(['category' => null]);

        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("ALTER TABLE production_processes MODIFY process_type ENUM(
            'knitting', 'dyeing', 'compacting', 'printing', 'cutting', 'stitching', 'packing', 'quality_check', 'other'
        ) NOT NULL");

        DB::statement("ALTER TABLE contacts MODIFY category ENUM(
            'knitting', 'dyeing', 'compacting', 'printing', 'cutting', 'stitching', 'packing', 'quality_check', 'other'
        ) NULL");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("ALTER TABLE production_processes MODIFY process_type ENUM(
            'knitting', 'dyeing', 'compacting', 'printing', 'cutting', 'stitching', 'packing', 'quality_check', 'dc', 'other'
        ) NOT NULL");

        DB::statement("ALTER TABLE contacts MODIFY category ENUM(
            'knitting', 'dyeing', 'compacting', 'printing', 'cutting', 'stitching', 'packing', 'quality_check', 'dc', 'other'
        ) NULL");
    }
};
