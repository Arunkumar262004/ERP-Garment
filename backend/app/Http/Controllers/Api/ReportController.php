<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\CrmTask;
use App\Models\Delivery;
use App\Models\Invoice;
use App\Models\Lead;
use App\Models\ProductionOrder;
use App\Models\PurchaseOrder;
use App\Models\Quotation;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    protected function dateFilter(Request $request, $query, string $column)
    {
        if ($request->filled('from')) {
            $query->whereDate($column, '>=', $request->date('from'));
        }
        if ($request->filled('to')) {
            $query->whereDate($column, '<=', $request->date('to'));
        }

        return $query;
    }

    /**
     * Partial match on the request's `order_no` param against whichever
     * "number" column this report's primary record uses (order_no, po_no,
     * invoice_no, quotation_no, lead_no, delivery_no — the field the report
     * table actually shows as its first column).
     */
    protected function orderNoFilter(Request $request, $query, string $column)
    {
        if ($request->filled('order_no')) {
            $query->where($column, 'like', '%'.$request->string('order_no').'%');
        }

        return $query;
    }

    /**
     * Partial match on the request's `customer` param against the given
     * relation's `name` column (contact or supplier — whichever party this
     * report's records belong to).
     */
    protected function customerFilter(Request $request, $query, string $relation = 'contact')
    {
        if ($request->filled('customer')) {
            $customer = $request->string('customer');
            $query->whereHas($relation, fn ($q) => $q->where('name', 'like', "%{$customer}%"));
        }

        return $query;
    }

    public function orders(Request $request)
    {
        $query = ProductionOrder::with(['contact', 'processes']);
        $this->dateFilter($request, $query, 'order_date');
        $this->orderNoFilter($request, $query, 'order_no');
        $this->customerFilter($request, $query);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $orders = $query->latest()->get();

        return response()->json([
            'summary' => [
                'total_orders' => $orders->count(),
                'total_quantity' => (float) $orders->sum('total_quantity'),
                'by_status' => $orders->groupBy('status')->map->count(),
            ],
            'data' => $orders,
        ]);
    }

    public function b2b(Request $request)
    {
        return $this->contactTypeReport($request, 'b2b');
    }

    public function b2c(Request $request)
    {
        return $this->contactTypeReport($request, 'b2c');
    }

    protected function contactTypeReport(Request $request, string $type)
    {
        $contactIds = Contact::where('type', $type)->pluck('id');

        $invoiceQuery = Invoice::whereIn('contact_id', $contactIds);
        $this->dateFilter($request, $invoiceQuery, 'invoice_date');
        $this->orderNoFilter($request, $invoiceQuery, 'invoice_no');
        $this->customerFilter($request, $invoiceQuery);
        $invoices = $invoiceQuery->get();

        $quotationQuery = Quotation::whereIn('contact_id', $contactIds);
        $this->dateFilter($request, $quotationQuery, 'quotation_date');
        $this->orderNoFilter($request, $quotationQuery, 'quotation_no');
        $this->customerFilter($request, $quotationQuery);
        $quotations = $quotationQuery->get();

        return response()->json([
            'summary' => [
                'total_contacts' => $contactIds->count(),
                'total_invoiced' => (float) $invoices->sum('total'),
                'total_collected' => (float) $invoices->sum('paid_amount'),
                'total_outstanding' => (float) $invoices->sum('balance_amount'),
                'total_quotations' => $quotations->count(),
                'quotations_approved' => $quotations->where('status', 'approved')->count(),
            ],
            'invoices' => $invoices->load('contact'),
            'quotations' => $quotations->load('contact'),
        ]);
    }

    public function production(Request $request)
    {
        $query = ProductionOrder::with(['contact', 'processes']);
        $this->dateFilter($request, $query, 'order_date');
        $this->orderNoFilter($request, $query, 'order_no');
        $this->customerFilter($request, $query);
        $orders = $query->latest()->get();

        $processStats = $orders->flatMap->processes->groupBy('process_type')->map(function ($group) {
            return [
                'total' => $group->count(),
                'completed' => $group->where('status', 'completed')->count(),
                'in_progress' => $group->where('status', 'in_progress')->count(),
                'pending' => $group->where('status', 'pending')->count(),
            ];
        });

        return response()->json([
            'summary' => [
                'total_orders' => $orders->count(),
                'by_status' => $orders->groupBy('status')->map->count(),
                'by_process' => $processStats,
            ],
            'data' => $orders,
        ]);
    }

    public function purchase(Request $request)
    {
        $query = PurchaseOrder::with(['supplier', 'items.rawMaterial']);
        $this->dateFilter($request, $query, 'order_date');
        $this->orderNoFilter($request, $query, 'po_no');
        $this->customerFilter($request, $query, 'supplier');
        $orders = $query->latest()->get();

        return response()->json([
            'summary' => [
                'total_orders' => $orders->count(),
                'total_value' => (float) $orders->sum('total'),
                'by_status' => $orders->groupBy('status')->map->count(),
                'by_supplier' => $orders->groupBy('supplier.name')->map->count(),
            ],
            'data' => $orders,
        ]);
    }

    public function accounts(Request $request)
    {
        $invoiceQuery = Invoice::with('contact');
        $this->dateFilter($request, $invoiceQuery, 'invoice_date');
        $this->orderNoFilter($request, $invoiceQuery, 'invoice_no');
        $this->customerFilter($request, $invoiceQuery);
        $invoices = $invoiceQuery->get();

        $quotationQuery = Quotation::with('contact');
        $this->dateFilter($request, $quotationQuery, 'quotation_date');
        $this->orderNoFilter($request, $quotationQuery, 'quotation_no');
        $this->customerFilter($request, $quotationQuery);
        $quotations = $quotationQuery->get();

        return response()->json([
            'summary' => [
                'total_invoiced' => (float) $invoices->sum('total'),
                'total_collected' => (float) $invoices->sum('paid_amount'),
                'total_outstanding' => (float) $invoices->sum('balance_amount'),
                'invoices_by_status' => $invoices->groupBy('status')->map->count(),
                'total_quotations' => $quotations->count(),
                'quotations_by_status' => $quotations->groupBy('status')->map->count(),
            ],
            'invoices' => $invoices,
            'quotations' => $quotations,
        ]);
    }

    public function crm(Request $request)
    {
        $leadQuery = Lead::query();
        $this->dateFilter($request, $leadQuery, 'created_at');
        $this->orderNoFilter($request, $leadQuery, 'lead_no');

        if ($request->filled('customer')) {
            $customer = $request->string('customer');
            $leadQuery->where(function ($q) use ($customer) {
                $q->where('name', 'like', "%{$customer}%")->orWhere('company_name', 'like', "%{$customer}%");
            });
        }

        $leads = $leadQuery->get();

        $tasks = CrmTask::with('lead')->get();

        return response()->json([
            'summary' => [
                'total_leads' => $leads->count(),
                'by_status' => $leads->groupBy('status')->map->count(),
                'by_source' => $leads->groupBy('source')->map->count(),
                'conversion_rate' => $leads->count() ? round($leads->where('status', 'won')->count() / $leads->count() * 100, 2) : 0,
                'pipeline_value' => (float) $leads->whereNotIn('status', ['won', 'lost'])->sum('expected_value'),
                'tasks_pending' => $tasks->where('status', 'pending')->count(),
                'tasks_completed' => $tasks->where('status', 'completed')->count(),
            ],
            'leads' => $leads,
            'tasks' => $tasks,
        ]);
    }

    public function delivery(Request $request)
    {
        $query = Delivery::with(['contact', 'productionOrder']);
        $this->dateFilter($request, $query, 'delivery_date');
        $this->customerFilter($request, $query);

        if ($request->filled('order_no')) {
            $orderNo = $request->string('order_no');
            $query->where(function ($q) use ($orderNo) {
                $q->where('delivery_no', 'like', "%{$orderNo}%")
                    ->orWhereHas('productionOrder', fn ($q2) => $q2->where('order_no', 'like', "%{$orderNo}%"));
            });
        }

        $deliveries = $query->latest()->get();

        return response()->json([
            'summary' => [
                'total' => $deliveries->count(),
                'by_status' => $deliveries->groupBy('status')->map->count(),
            ],
            'data' => $deliveries,
        ]);
    }
}
