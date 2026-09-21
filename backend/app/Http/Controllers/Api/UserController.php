<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index()
    {
        return User::where('is_active', true)->orderBy('name')->get(['id', 'name', 'role']);
    }

    public function list(Request $request)
    {
        abort_unless($request->user()->role === 'admin', 403, 'Only administrators can manage users.');

        $query = User::with('assignedRole');

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->string('role'));
        }

        if ($request->filled('status')) {
            $query->where('is_active', $request->string('status') === 'active');
        }

        return $query->orderBy('name')->paginate($request->integer('per_page', 15));
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->role === 'admin', 403, 'Only administrators can manage users.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'in:admin,sales,accounts,production,purchase,crm,viewer'],
            'role_id' => ['nullable', 'exists:roles,id'],
            'specialization' => ['nullable', 'in:healthcare_erp,basic_crm,automation_crm,general'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);

        return response()->json($user->load('assignedRole'), 201);
    }

    public function show(Request $request, User $user)
    {
        abort_unless($request->user()->role === 'admin', 403, 'Only administrators can manage users.');

        return $user;
    }

    public function update(Request $request, User $user)
    {
        abort_unless($request->user()->role === 'admin', 403, 'Only administrators can manage users.');

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['sometimes', 'in:admin,sales,accounts,production,purchase,crm,viewer'],
            'role_id' => ['nullable', 'exists:roles,id'],
            'specialization' => ['nullable', 'in:healthcare_erp,basic_crm,automation_crm,general'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        return $user->load('assignedRole');
    }

    public function destroy(Request $request, User $user)
    {
        abort_unless($request->user()->role === 'admin', 403, 'Only administrators can manage users.');

        if ($user->id === $request->user()->id) {
            abort(422, 'You cannot deactivate your own account.');
        }

        $user->is_active = false;
        $user->save();

        return response()->json(null, 204);
    }
}
