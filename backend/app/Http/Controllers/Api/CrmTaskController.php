<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CrmTask;
use Illuminate\Http\Request;

class CrmTaskController extends Controller
{
    public function index(Request $request)
    {
        $query = CrmTask::with(['lead', 'contact', 'assignee']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->integer('assigned_to'));
        }

        if ($request->filled('lead_id')) {
            $query->where('lead_id', $request->integer('lead_id'));
        }

        return $query->orderBy('due_date')->paginate($request->integer('per_page', 15));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'lead_id' => ['nullable', 'exists:leads,id'],
            'contact_id' => ['nullable', 'exists:contacts,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['nullable', 'in:call,meeting,follow_up,email,other'],
            'priority' => ['nullable', 'in:low,medium,high'],
            'status' => ['nullable', 'in:pending,in_progress,completed,cancelled'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'due_date' => ['nullable', 'date'],
        ]);

        $data['created_by'] = $request->user()->id;

        $task = CrmTask::create($data);

        return response()->json($task->load(['lead', 'contact', 'assignee']), 201);
    }

    public function show(CrmTask $crmTask)
    {
        return $crmTask->load(['lead', 'contact', 'assignee']);
    }

    public function update(Request $request, CrmTask $crmTask)
    {
        $data = $request->validate([
            'lead_id' => ['nullable', 'exists:leads,id'],
            'contact_id' => ['nullable', 'exists:contacts,id'],
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['nullable', 'in:call,meeting,follow_up,email,other'],
            'priority' => ['nullable', 'in:low,medium,high'],
            'status' => ['nullable', 'in:pending,in_progress,completed,cancelled'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'due_date' => ['nullable', 'date'],
        ]);

        if (($data['status'] ?? null) === 'completed' && ! $crmTask->completed_at) {
            $data['completed_at'] = now();
        }

        $crmTask->update($data);

        return $crmTask->load(['lead', 'contact', 'assignee']);
    }

    public function destroy(CrmTask $crmTask)
    {
        $crmTask->delete();

        return response()->json(null, 204);
    }
}
