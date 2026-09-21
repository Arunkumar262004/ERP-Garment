<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\Invoice;
use App\Models\Lead;
use App\Models\ProductionOrder;
use App\Models\PurchaseOrder;
use App\Models\Quotation;

class LookupController extends Controller
{
    /**
     * Return the full record for any business document/contact code, whatever
     * module it belongs to. Deliberately returns everything rather than
     * picking out a field — an LLM-driven caller (e.g. n8n's AI Agent) decides
     * which part of the data actually answers the user's question.
     */
    public function show(string $code)
    {
        $code = strtoupper($code);

        $record = match (true) {
            str_starts_with($code, 'PRD-') => ProductionOrder::with(['contact', 'processes'])->where('order_no', $code)->first(),
            str_starts_with($code, 'B2B-'), str_starts_with($code, 'B2C-'), str_starts_with($code, 'EMP-') => Contact::where('code', $code)->first(),
            str_starts_with($code, 'QUO-') => Quotation::with('contact')->where('quotation_no', $code)->first(),
            str_starts_with($code, 'INV-') => Invoice::with('contact')->where('invoice_no', $code)->first(),
            str_starts_with($code, 'PO-') => PurchaseOrder::with('supplier')->where('po_no', $code)->first(),
            str_starts_with($code, 'LEAD-') => Lead::with('contact')->where('lead_no', $code)->first(),
            default => null,
        };

        if (! $record) {
            return response()->json([
                'found' => false,
                'message' => "No record found for code {$code}.",
            ], 404);
        }

        $data = $record->toArray();

        if ($record instanceof ProductionOrder) {
            $data['current_stage'] = $record->currentStageLabel();
        }

        return response()->json([
            'found' => true,
            'code' => $code,
            'data' => $data,
        ]);
    }
}
