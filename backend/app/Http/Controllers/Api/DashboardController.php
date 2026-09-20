<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\Delivery;
use App\Models\Invoice;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\ProductionOrder;
use App\Models\PurchaseOrder;
use App\Models\Quotation;
use App\Models\RawMaterial;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $now = now();

        return response()->json([
            'contacts' => [
                'b2b' => Contact::where('type', 'b2b')->count(),
                'b2c' => Contact::where('type', 'b2c')->count(),
                'employee' => Contact::where('type', 'employee')->count(),
            ],
            'crm' => [
                'open_leads' => Lead::whereNotIn('status', ['won', 'lost'])->count(),
                'won_this_month' => Lead::where('status', 'won')
                    ->whereMonth('updated_at', $now->month)->whereYear('updated_at', $now->year)->count(),
                'pipeline_value' => (float) Lead::whereNotIn('status', ['won', 'lost'])->sum('expected_value'),
            ],
            'accounts' => [
                'pending_quotations' => Quotation::whereIn('status', ['draft', 'sent'])->count(),
                'unpaid_invoices' => Invoice::whereIn('status', ['sent', 'partial', 'overdue'])->count(),
                'outstanding_amount' => (float) Invoice::whereIn('status', ['sent', 'partial', 'overdue'])->sum('balance_amount'),
                'revenue_this_month' => (float) Payment::whereMonth('payment_date', $now->month)
                    ->whereYear('payment_date', $now->year)->sum('amount'),
            ],
            'production' => [
                'pending' => ProductionOrder::where('status', 'pending')->count(),
                'in_production' => ProductionOrder::where('status', 'in_production')->count(),
                'completed' => ProductionOrder::where('status', 'completed')->count(),
                'delivered' => ProductionOrder::where('status', 'delivered')->count(),
            ],
            'purchase' => [
                'open_purchase_orders' => PurchaseOrder::whereIn('status', ['draft', 'ordered', 'partially_received'])->count(),
                'low_stock_materials' => RawMaterial::whereColumn('current_stock', '<=', 'reorder_level')->count(),
            ],
            'delivery' => [
                'pending' => Delivery::whereIn('status', ['pending', 'dispatched'])->count(),
                'delivered_this_month' => Delivery::where('status', 'delivered')
                    ->whereMonth('delivery_date', $now->month)->whereYear('delivery_date', $now->year)->count(),
            ],
            'monthly_revenue_trend' => Payment::where('payment_date', '>=', $now->copy()->subMonths(5)->startOfMonth())
                ->get(['payment_date', 'amount'])
                ->groupBy(fn ($payment) => $payment->payment_date->format('Y-m'))
                ->map(fn ($group, $month) => ['month' => $month, 'total' => (float) $group->sum('amount')])
                ->sortBy('month')
                ->values(),
        ]);
    }
}
