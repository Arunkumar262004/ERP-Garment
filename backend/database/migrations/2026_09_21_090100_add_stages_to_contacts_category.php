<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Keeps contacts.category (which process stage an employee leads) in sync
 * with the new production stages added in
 * 2026_09_21_090000_add_stages_to_production_processes_table.
 */
return new class extends Migration
{
    public function up(): void
    {
        // See 2026_09_21_090000_add_stages_to_production_processes_table for
        // why this is MySQL-only — SQLite (tests) has no ALTER ... MODIFY.
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("ALTER TABLE contacts MODIFY category ENUM(
            'knitting', 'dyeing', 'compacting', 'printing', 'cutting', 'stitching', 'packing', 'quality_check', 'dc', 'other'
        ) NULL");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("ALTER TABLE contacts MODIFY category ENUM(
            'cutting', 'dyeing', 'stitching', 'printing', 'packing', 'quality_check', 'other'
        ) NULL");
    }
};
