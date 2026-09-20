<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function index(Request $request)
    {
        $query = Lead::with(['contact', 'assignee']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->integer('assigned_to'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhere('lead_no', 'like', "%{$search}%");
            });
        }

        return $query->latest()->paginate($request->integer('per_page', 15));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'contact_id' => ['nullable', 'exists:contacts,id'],
            'name' => ['required', 'string', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'source' => ['nullable', 'in:website,referral,cold_call,social_media,exhibition,other'],
            'status' => ['nullable', 'in:new,contacted,qualified,proposal,negotiation,won,lost'],
            'expected_value' => ['nullable', 'numeric'],
            'expected_close_date' => ['nullable', 'date'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'notes' => ['nullable', 'string'],
        ]);

        $data['created_by'] = $request->user()->id;

        $lead = Lead::create($data);
        $lead->update(['lead_no' => sprintf('LEAD-%05d', $lead->id)]);

        return response()->json($lead->load(['contact', 'assignee']), 201);
    }

    public function show(Lead $lead)
    {
        return $lead->load(['contact', 'assignee', 'tasks', 'quotations']);
    }

    public function update(Request $request, Lead $lead)
    {
        $data = $request->validate([
            'contact_id' => ['nullable', 'exists:contacts,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'source' => ['nullable', 'in:website,referral,cold_call,social_media,exhibition,other'],
            'status' => ['nullable', 'in:new,contacted,qualified,proposal,negotiation,won,lost'],
            'expected_value' => ['nullable', 'numeric'],
            'expected_close_date' => ['nullable', 'date'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'notes' => ['nullable', 'string'],
        ]);

        $lead->update($data);

        return $lead->load(['contact', 'assignee']);
    }

    public function destroy(Lead $lead)
    {
        $lead->delete();

        return response()->json(null, 204);
    }
}
