<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LeadController extends Controller
{
    protected function itemRules(): array
    {
        return [
            'items' => ['nullable', 'array'],
            'items.*.product_id' => ['nullable', 'exists:products,id'],
            'items.*.description' => ['required_with:items', 'string', 'max:255'],
            'items.*.quantity' => ['required_with:items', 'numeric', 'min:0.01'],
            'items.*.unit' => ['nullable', 'string', 'max:30'],
            'items.*.target_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.delivery_date' => ['nullable', 'date'],
            'items.*.notes' => ['nullable', 'string'],
        ];
    }

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
        $data = $request->validate(array_merge([
            'contact_id' => ['nullable', 'exists:contacts,id'],
            'name' => ['required', 'string', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'digits:10'],
            'source' => ['nullable', 'in:website,referral,cold_call,social_media,exhibition,other'],
            'status' => ['nullable', 'in:new,contacted,qualified,proposal,negotiation,won,lost'],
            'expected_value' => ['nullable', 'numeric', 'min:0'],
            'expected_close_date' => ['nullable', 'date'],
            'follow_up_date' => ['nullable', 'date'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'notes' => ['nullable', 'string'],
        ], $this->itemRules()));

        $data['created_by'] = $request->user()->id;
        $items = $data['items'] ?? [];
        unset($data['items']);

        $lead = DB::transaction(function () use ($data, $items) {
            $lead = Lead::create($data);
            $lead->update(['lead_no' => sprintf('LEAD-%05d', $lead->id)]);

            foreach ($items as $item) {
                $lead->items()->create($item);
            }

            return $lead;
        });

        return response()->json($lead->load(['contact', 'assignee', 'items']), 201);
    }

    public function show(Lead $lead)
    {
        return $lead->load(['contact', 'assignee', 'tasks', 'quotations', 'items']);
    }

    public function update(Request $request, Lead $lead)
    {
        $data = $request->validate(array_merge([
            'contact_id' => ['nullable', 'exists:contacts,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'digits:10'],
            'source' => ['nullable', 'in:website,referral,cold_call,social_media,exhibition,other'],
            'status' => ['nullable', 'in:new,contacted,qualified,proposal,negotiation,won,lost'],
            'expected_value' => ['nullable', 'numeric', 'min:0'],
            'expected_close_date' => ['nullable', 'date'],
            'follow_up_date' => ['nullable', 'date'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'notes' => ['nullable', 'string'],
        ], [
            'items' => ['sometimes', 'array'],
            'items.*.product_id' => ['nullable', 'exists:products,id'],
            'items.*.description' => ['required_with:items', 'string', 'max:255'],
            'items.*.quantity' => ['required_with:items', 'numeric', 'min:0.01'],
            'items.*.unit' => ['nullable', 'string', 'max:30'],
            'items.*.target_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.delivery_date' => ['nullable', 'date'],
            'items.*.notes' => ['nullable', 'string'],
        ]));

        DB::transaction(function () use ($data, $lead) {
            if (array_key_exists('items', $data)) {
                $items = $data['items'];
                unset($data['items']);
                $lead->items()->delete();
                foreach ($items as $item) {
                    $lead->items()->create($item);
                }
            }

            $lead->update($data);
        });

        return $lead->load(['contact', 'assignee', 'items']);
    }

    public function destroy(Lead $lead)
    {
        $lead->delete();

        return response()->json(null, 204);
    }

    /**
     * Convert a lead into a Customer contact — creates the Contact as the
     * requested type (B2B/B2C, chosen explicitly by the caller — the frontend
     * asks via a modal), links it back to the lead, and marks the lead Won.
     * Idempotent: converting an already-converted lead is a no-op that just
     * returns its existing linked contact.
     */
    public function convert(Request $request, Lead $lead)
    {
        if ($lead->contact_id) {
            return $lead->load(['contact', 'assignee']);
        }

        $data = $request->validate([
            'type' => ['nullable', 'in:b2b,b2c'],
        ]);

        $lead = DB::transaction(function () use ($lead, $request, $data) {
            $type = $data['type'] ?? ($lead->company_name ? 'b2b' : 'b2c');
            $prefix = $type === 'b2b' ? 'B2B' : 'B2C';

            $contact = Contact::create([
                'type' => $type,
                'name' => $lead->name,
                'company_name' => $lead->company_name,
                'email' => $lead->email,
                'phone' => $lead->phone,
                'status' => 'active',
                'created_by' => $request->user()->id,
            ]);
            $contact->update(['code' => sprintf('%s-%05d', $prefix, $contact->id)]);

            $lead->update(['contact_id' => $contact->id, 'status' => 'won']);

            return $lead;
        });

        return $lead->load(['contact', 'assignee']);
    }

    protected function quickCaptureRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'digits:10'],
            'interest' => ['nullable', 'in:healthcare_erp,basic_crm,automation_crm,general'],
            'source' => ['nullable', 'in:website,referral,cold_call,social_media,exhibition,other'],
            'notes' => ['nullable', 'string'],
        ];
    }

    /**
     * Shared lead-intake logic: given who the enquiry is interested in (a
     * product/service specialization), auto-assign it to the least-loaded
     * matching sales user — the specialist with the fewest currently-open
     * leads (status not won/lost) — so leads are load-balanced rather than
     * piling onto whoever's already busiest. Falls back to the least-loaded
     * active sales user of any specialization if no specialist matches, then
     * leaves it unassigned if there are no active sales users at all. Also
     * stamps a default follow-up date so the lead surfaces in follow-up
     * tracking without the submitter having to think about it. Used by both
     * the authenticated quick-capture form and the public webhook.
     */
    protected function captureLead(array $data, ?int $createdBy): Lead
    {
        $interest = $data['interest'] ?? null;
        unset($data['interest']);

        $assignee = null;

        if ($interest) {
            $assignee = User::where('role', 'sales')
                ->where('is_active', true)
                ->where('specialization', $interest)
                ->withCount(['leads as open_leads_count' => fn ($q) => $q->whereNotIn('status', ['won', 'lost'])])
                ->orderBy('open_leads_count')
                ->first();
        }

        if (! $assignee) {
            $assignee = User::where('role', 'sales')
                ->where('is_active', true)
                ->withCount(['leads as open_leads_count' => fn ($q) => $q->whereNotIn('status', ['won', 'lost'])])
                ->orderBy('open_leads_count')
                ->first();
        }

        $data['assigned_to'] = $assignee?->id;
        $data['source'] = $data['source'] ?? 'other';
        $data['follow_up_date'] = now()->addDays(2)->toDateString();
        $data['created_by'] = $createdBy;

        return DB::transaction(function () use ($data) {
            $lead = Lead::create($data);
            $lead->update(['lead_no' => sprintf('LEAD-%05d', $lead->id)]);

            return $lead;
        });
    }

    /**
     * Quick lead intake for logged-in staff (used by the in-app Quick Capture form).
     */
    public function quickCapture(Request $request)
    {
        $data = $request->validate($this->quickCaptureRules());
        $lead = $this->captureLead($data, $request->user()->id);

        return response()->json($lead->load(['contact', 'assignee']), 201);
    }

    /**
     * Public lead-intake webhook — no login required, so an external website
     * form or an n8n workflow can post a new enquiry directly. Protected by a
     * shared secret (LEAD_CAPTURE_SECRET) sent as the X-Lead-Capture-Secret
     * header, the same pattern this app already uses for inbound n8n
     * webhooks, so it can't be spammed by anyone who doesn't have the secret.
     */
    public function publicCapture(Request $request)
    {
        $configured = config('services.lead_capture.secret');
        abort_if(! $configured, 503, 'Public lead capture is not configured.');
        abort_unless(hash_equals($configured, (string) $request->header('X-Lead-Capture-Secret')), 401, 'Invalid or missing lead capture secret.');

        $data = $request->validate($this->quickCaptureRules());
        $lead = $this->captureLead($data, null);

        return response()->json($lead->load(['contact', 'assignee']), 201);
    }
}
