<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->timestamp('approved_at')->nullable()->after('status');
            $table->uuid('approval_event_id')->nullable()->unique()->after('approved_at');
        });
    }

    public function down(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            $table->dropColumn(['approved_at', 'approval_event_id']);
        });
    }
};
