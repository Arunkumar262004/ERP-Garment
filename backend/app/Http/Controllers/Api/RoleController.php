<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    /**
     * Mirrors frontend/src/lib/modules.ts's MODULE_TREE — keep both in sync
     * when a page/section is added or removed.
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

    protected function guardAdmin(Request $request): void
    {
        abort_unless($request->user()->role === 'admin', 403, 'Only administrators can manage roles.');
    }

    public function index(Request $request)
    {
        $this->guardAdmin($request);

        return Role::withCount('users')->orderBy('name')->get();
    }

    public function store(Request $request)
    {
        $this->guardAdmin($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:roles,name'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', Rule::in(self::ALL_MODULES)],
        ]);

        $role = Role::create($data);

        return response()->json($role, 201);
    }

    public function show(Request $request, Role $role)
    {
        $this->guardAdmin($request);

        return $role;
    }

    public function update(Request $request, Role $role)
    {
        $this->guardAdmin($request);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:100', Rule::unique('roles', 'name')->ignore($role->id)],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', Rule::in(self::ALL_MODULES)],
        ]);

        $role->update($data);

        return $role;
    }

    public function destroy(Request $request, Role $role)
    {
        $this->guardAdmin($request);

        $role->delete();

        return response()->json(null, 204);
    }
}
