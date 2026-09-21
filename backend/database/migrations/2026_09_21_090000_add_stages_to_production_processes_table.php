<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Adds knitting (pre-dyeing fabric stage), compacting (post-dyeing fabric
 * finishing), and dc (delivery challan, the final pre-dispatch stage) to the
 * production process pipeline. Laravel has no schema-builder helper for
 * altering a MySQL enum's allowed values, so this uses a raw ALTER TABLE.
 */
return new class extends Migration
{
    public function up(): void
    {
        // SQLite (used by the test suite) has no ALTER TABLE ... MODIFY —
        // its enum columns are just a CHECK constraint baked in at CREATE
        // TABLE time, with no built-in way to alter it afterwards. Only the
        // real MySQL database (dev/prod, via docker-compose) needs this.
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("ALTER TABLE production_processes MODIFY process_type ENUM(
            'knitting', 'dyeing', 'compacting', 'printing', 'cutting', 'stitching', 'packing', 'quality_check', 'dc', 'other'
        ) NOT NULL");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("ALTER TABLE production_processes MODIFY process_type ENUM(
            'cutting', 'dyeing', 'stitching', 'printing', 'packing', 'quality_check', 'other'
        ) NOT NULL");
    }
};
