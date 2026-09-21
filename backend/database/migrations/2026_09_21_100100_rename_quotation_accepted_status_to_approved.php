<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Renames the "accepted" quotation status to "approved" — aligns the stored
 * value with QuotationController::approve(), which already used the word
 * "approve" for this action while confusingly writing "accepted" to the DB.
 *
 * The original create_quotations_table migration was updated in place to
 * use 'approved' directly (SQLite/tests re-run every migration from scratch,
 * so it never has 'accepted' rows to migrate). This migration only needs to
 * handle the real MySQL database, which already has historical 'accepted'
 * rows and a column that doesn't yet allow 'approved'.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        // Widen the enum to allow both values, move the data, then narrow it —
        // MySQL enum columns have no ALTER support in Laravel's schema builder.
        DB::statement("ALTER TABLE quotations MODIFY status ENUM('draft', 'sent', 'accepted', 'approved', 'rejected', 'expired') NOT NULL DEFAULT 'draft'");
        DB::table('quotations')->where('status', 'accepted')->update(['status' => 'approved']);
        DB::statement("ALTER TABLE quotations MODIFY status ENUM('draft', 'sent', 'approved', 'rejected', 'expired') NOT NULL DEFAULT 'draft'");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("ALTER TABLE quotations MODIFY status ENUM('draft', 'sent', 'accepted', 'approved', 'rejected', 'expired') NOT NULL DEFAULT 'draft'");
        DB::table('quotations')->where('status', 'approved')->update(['status' => 'accepted']);
        DB::statement("ALTER TABLE quotations MODIFY status ENUM('draft', 'sent', 'accepted', 'rejected', 'expired') NOT NULL DEFAULT 'draft'");
    }
};
