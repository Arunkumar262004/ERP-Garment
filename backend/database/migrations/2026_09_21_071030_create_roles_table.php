<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The full module/sub-module key list. Mirrors
     * frontend/src/lib/modules.ts's MODULE_TREE — keep both in sync when a
     * page/section is added or removed.
     */
    public const ALL_MODULES = [
        'dashboard',
        'contacts.b2b', 'contacts.b2c', 'contacts.employees',
        'crm.leads', 'crm.tasks',
        'accounts.quotations', 'accounts.invoices', 'accounts.payments',
        'production',
        'purchase.raw-materials', 'purchase.suppliers', 'purchase.orders',
        'delivery',
        'inventory',
        'reports',
        'masters.sizes', 'masters.brands',
        'settings.users', 'settings.roles',
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->json('permissions')->nullable();
            $table->timestamps();
        });

        $now = now();

        DB::table('roles')->insert([
            ['name' => 'Admin', 'permissions' => json_encode(self::ALL_MODULES), 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Sales', 'permissions' => json_encode([
                'dashboard', 'contacts.b2b', 'contacts.b2c', 'crm.leads', 'crm.tasks',
                'accounts.quotations', 'accounts.invoices', 'accounts.payments', 'reports',
            ]), 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Accounts', 'permissions' => json_encode([
                'dashboard', 'accounts.quotations', 'accounts.invoices', 'accounts.payments', 'reports',
            ]), 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Production', 'permissions' => json_encode([
                'dashboard', 'production', 'purchase.raw-materials', 'delivery', 'reports',
            ]), 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Purchase', 'permissions' => json_encode([
                'dashboard', 'purchase.raw-materials', 'purchase.suppliers', 'purchase.orders', 'reports',
            ]), 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'CRM', 'permissions' => json_encode([
                'dashboard', 'crm.leads', 'crm.tasks', 'contacts.b2b', 'contacts.b2c', 'reports',
            ]), 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Viewer', 'permissions' => json_encode(['dashboard', 'reports']), 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
