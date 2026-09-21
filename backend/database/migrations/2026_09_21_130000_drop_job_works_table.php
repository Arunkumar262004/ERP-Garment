<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Full revert of the Job Work (Outward/Inward DC) feature — it didn't match
 * how the business actually wants this tracked. Production goes back to
 * being driven purely by the process status/quantity fields on
 * ProductionProcess, same as before this feature existed.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('job_works');
    }

    public function down(): void
    {
        // Intentionally not recreated — this is a deliberate feature removal,
        // not a reversible schema tweak. Restore from the two migrations that
        // originally created/extended job_works if this ever needs to come back.
    }
};
