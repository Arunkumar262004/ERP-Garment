<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\CrmTaskController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DeliveryController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProductionOrderController;
use App\Http\Controllers\Api\ProductionProcessController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\QuotationController;
use App\Http\Controllers\Api\RawMaterialController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SupplierController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::apiResource('contacts', ContactController::class);

    Route::apiResource('leads', LeadController::class);
    Route::apiResource('crm-tasks', CrmTaskController::class);

    Route::apiResource('quotations', QuotationController::class);
    Route::apiResource('invoices', InvoiceController::class);
    Route::apiResource('payments', PaymentController::class)->only(['index', 'store', 'destroy']);

    Route::apiResource('suppliers', SupplierController::class);
    Route::apiResource('raw-materials', RawMaterialController::class);
    Route::apiResource('purchase-orders', PurchaseOrderController::class);
    Route::post('/purchase-orders/{purchaseOrder}/receive', [PurchaseOrderController::class, 'receive']);

    Route::apiResource('production-orders', ProductionOrderController::class);
    Route::post('/production-orders/{productionOrder}/processes', [ProductionProcessController::class, 'store']);
    Route::apiResource('production-processes', ProductionProcessController::class)->only(['index', 'update', 'destroy']);

    Route::apiResource('deliveries', DeliveryController::class);

    Route::prefix('reports')->group(function () {
        Route::get('/orders', [ReportController::class, 'orders']);
        Route::get('/b2b', [ReportController::class, 'b2b']);
        Route::get('/b2c', [ReportController::class, 'b2c']);
        Route::get('/production', [ReportController::class, 'production']);
        Route::get('/purchase', [ReportController::class, 'purchase']);
        Route::get('/accounts', [ReportController::class, 'accounts']);
        Route::get('/crm', [ReportController::class, 'crm']);
        Route::get('/delivery', [ReportController::class, 'delivery']);
    });
});
