<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\CrmTask;
use App\Models\Delivery;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\ProductionOrder;
use App\Models\PurchaseOrder;
use App\Models\Quotation;
use App\Models\RawMaterial;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    protected function change(float $current, float $previous): ?float
    {
        if ($previous == 0.0) {
            return $current > 0 ? null : 0.0;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    public function index()
    {
        $now = now();
        $today = $now->copy()->startOfDay();
        $yesterday = $now->copy()->subDay()->startOfDay();

        $salesToday = (float) Invoice::whereDate('invoice_date', $today)->sum('total');
        $salesYesterday = (float) Invoice::whereDate('invoice_date', $yesterday)->sum('total');

        $purchasesToday = (float) PurchaseOrder::whereDate('order_date', $today)->sum('total');
        $purchasesYesterday = (float) PurchaseOrder::whereDate('order_date', $yesterday)->sum('total');

        $productionToday = (float) ProductionOrder::whereDate('order_date', $today)->sum('total_quantity');
        $productionYesterday = (float) ProductionOrder::whereDate('order_date', $yesterday)->sum('total_quantity');

        $revenueMtd = (float) Payment::whereMonth('payment_date', $now->month)->whereYear('payment_date', $now->year)->sum('amount');
        $lastMonth = $now->copy()->subMonthNoOverflow();
        $revenueLastMonth = (float) Payment::whereMonth('payment_date', $lastMonth->month)->whereYear('payment_date', $lastMonth->year)->sum('amount');

        $inventoryValue = (float) RawMaterial::sum(DB::raw('current_stock * unit_price'));

        $itemTotals = InvoiceItem::select('description', DB::raw('SUM(quantity) as qty'))
            ->groupBy('description')->orderByDesc('qty')->get();
        $grandQty = (float) $itemTotals->sum('qty');
        $topItems = $itemTotals->take(4)->map(fn ($row) => [
            'label' => $row->description,
            'value' => (float) $row->qty,
            'percent' => $grandQty > 0 ? round(((float) $row->qty / $grandQty) * 100, 1) : 0,
        ])->values();
        $othersQty = $grandQty - $topItems->sum('value');
        if ($othersQty > 0) {
            $topItems->push([
                'label' => 'Others',
                'value' => $othersQty,
                'percent' => $grandQty > 0 ? round(($othersQty / $grandQty) * 100, 1) : 0,
            ]);
        }

        $lowStockMaterials = RawMaterial::whereColumn('current_stock', '<=', 'reorder_level')
            ->orderBy('current_stock')->limit(6)
            ->get(['id', 'sku', 'name', 'current_stock', 'reorder_level', 'unit']);

        $productionStatus = ProductionOrder::with(['contact', 'processes'])
            ->latest()->limit(6)->get()
            ->map(function ($order) {
                $total = $order->processes->count();
                $completed = $order->processes->where('status', 'completed')->count();
                $current = $order->processes->firstWhere('status', 'in_progress')
                    ?? $order->processes->firstWhere('status', 'pending');

                return [
                    'id' => $order->id,
                    'order_no' => $order->order_no,
                    'customer' => $order->contact->name ?? null,
                    'status' => $order->status,
                    'progress' => $total > 0 ? round(($completed / $total) * 100) : 0,
                    'current_process' => $order->status === 'completed' || $order->status === 'delivered'
                        ? 'Completed'
                        : ($current->process_type ?? '—'),
                ];
            });

        $leadCounts = Lead::whereNotNull('assigned_to')->select('assigned_to', DB::raw('count(*) as leads'))
            ->groupBy('assigned_to')->pluck('leads', 'assigned_to');
        $taskDoneCounts = CrmTask::whereNotNull('assigned_to')->where('status', 'completed')
            ->select('assigned_to', DB::raw('count(*) as done'))->groupBy('assigned_to')->pluck('done', 'assigned_to');
        $taskPendingCounts = CrmTask::whereNotNull('assigned_to')->whereIn('status', ['pending', 'in_progress'])
            ->select('assigned_to', DB::raw('count(*) as pending'))->groupBy('assigned_to')->pluck('pending', 'assigned_to');

        $userIds = collect()->merge($leadCounts->keys())->merge($taskDoneCounts->keys())->merge($taskPendingCounts->keys())->unique();
        $teamActivity = User::whereIn('id', $userIds)->get()->map(fn ($user) => [
            'name' => $user->name,
            'leads' => (int) ($leadCounts[$user->id] ?? 0),
            'tasks_done' => (int) ($taskDoneCounts[$user->id] ?? 0),
            'tasks_pending' => (int) ($taskPendingCounts[$user->id] ?? 0),
        ])->sortByDesc('leads')->values()->take(6);

        return response()->json([
            'kpis' => [
                'sales_today' => ['value' => $salesToday, 'change' => $this->change($salesToday, $salesYesterday)],
                'purchases_today' => ['value' => $purchasesToday, 'change' => $this->change($purchasesToday, $purchasesYesterday)],
                'inventory_value' => ['value' => $inventoryValue, 'change' => null],
                'production_today' => ['value' => $productionToday, 'change' => $this->change($productionToday, $productionYesterday)],
                'revenue_mtd' => ['value' => $revenueMtd, 'change' => $this->change($revenueMtd, $revenueLastMonth)],
            ],
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
                'revenue_this_month' => $revenueMtd,
            ],
            'production' => [
                'pending' => ProductionOrder::where('status', 'pending')->count(),
                'in_production' => ProductionOrder::where('status', 'in_production')->count(),
                'completed' => ProductionOrder::where('status', 'completed')->count(),
                'delivered' => ProductionOrder::where('status', 'delivered')->count(),
            ],
            'purchase' => [
                'open_purchase_orders' => PurchaseOrder::whereIn('status', ['draft', 'ordered', 'partially_received'])->count(),
                'low_stock_materials' => $lowStockMaterials->count(),
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
            'top_items' => $topItems,
            'low_stock_materials' => $lowStockMaterials,
            'production_status' => $productionStatus,
            'team_activity' => $teamActivity,
        ]);
    }
}
