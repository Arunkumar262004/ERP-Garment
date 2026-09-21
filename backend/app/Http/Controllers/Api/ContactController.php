<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\ProductionProcess;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function index(Request $request)
    {
        $query = Contact::query();

        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->string('category'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        return $query->latest()->paginate($request->integer('per_page', 15));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'type' => ['required', 'in:b2b,b2c,employee'],
            'name' => ['required', 'string', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'digits:10'],
            'alternate_phone' => ['nullable', 'string', 'max:30'],
            'gst_number' => ['nullable', 'string', 'max:30'],
            'pan_number' => ['nullable', 'string', 'max:20'],
            'billing_address' => ['nullable', 'string'],
            'shipping_address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'pincode' => ['nullable', 'string', 'max:20'],
            'employee_code' => ['nullable', 'string', 'max:50'],
            'designation' => ['nullable', 'string', 'max:100'],
            'department' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'in:'.implode(',', ProductionProcess::PROCESS_TYPES)],
            'date_of_joining' => ['nullable', 'date'],
            'status' => ['nullable', 'in:active,inactive'],
            'notes' => ['nullable', 'string'],
        ]);

        $prefix = ['b2b' => 'B2B', 'b2c' => 'B2C', 'employee' => 'EMP'][$data['type']];
        $data['created_by'] = $request->user()->id;

        $contact = Contact::create($data);
        $contact->update(['code' => sprintf('%s-%05d', $prefix, $contact->id)]);

        return response()->json($contact, 201);
    }

    public function show(Contact $contact)
    {
        return $contact->load(['leads', 'quotations', 'invoices', 'productionOrders']);
    }

    public function update(Request $request, Contact $contact)
    {
        $data = $request->validate([
            'type' => ['sometimes', 'in:b2b,b2c,employee'],
            'name' => ['sometimes', 'string', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'digits:10'],
            'alternate_phone' => ['nullable', 'string', 'max:30'],
            'gst_number' => ['nullable', 'string', 'max:30'],
            'pan_number' => ['nullable', 'string', 'max:20'],
            'billing_address' => ['nullable', 'string'],
            'shipping_address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'pincode' => ['nullable', 'string', 'max:20'],
            'employee_code' => ['nullable', 'string', 'max:50'],
            'designation' => ['nullable', 'string', 'max:100'],
            'department' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'in:'.implode(',', ProductionProcess::PROCESS_TYPES)],
            'date_of_joining' => ['nullable', 'date'],
            'status' => ['nullable', 'in:active,inactive'],
            'notes' => ['nullable', 'string'],
        ]);

        $contact->update($data);

        return $contact;
    }

    public function destroy(Contact $contact)
    {
        $contact->delete();

        return response()->json(null, 204);
    }
}
