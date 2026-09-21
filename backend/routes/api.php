<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\ChatProxyController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\CrmTaskController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DeliveryController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\LookupController;
use App\Http\Controllers\Api\N8nTestController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductionOrderController;
use App\Http\Controllers\Api\ProductionOrderItemController;
use App\Http\Controllers\Api\ProductionProcessController;
use App\Http\Controllers\Api\ProductVariantController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\QuotationController;
use App\Http\Controllers\Api\RawMaterialController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\SizeController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

// Public webhook — no login required, secured by the X-Lead-Capture-Secret
// header instead (see LeadController::publicCapture). Deliberately outside
// the auth:sanctum group so an external site or n8n can post directly.
Route::post('/public/leads', [LeadController::class, 'publicCapture']);

// Genuinely public inquiry form — no login, no secret header (unlike
// /public/leads above, this is meant to be called straight from an anonymous
// browser, so a secret would be visible in the client bundle). Rate-limited
// instead to deter abuse.
Route::post('/public/inquiries', [LeadController::class, 'publicInquiry'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/users', [UserController::class, 'index']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    Route::prefix('admin')->group(function () {
        Route::get('/users', [UserController::class, 'list']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{user}', [UserController::class, 'show']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
        Route::get('/roles', [RoleController::class, 'index']);
        Route::post('/roles', [RoleController::class, 'store']);
        Route::get('/roles/{role}', [RoleController::class, 'show']);
        Route::put('/roles/{role}', [RoleController::class, 'update']);
        Route::delete('/roles/{role}', [RoleController::class, 'destroy']);
    });
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::put('/profile/password', [AuthController::class, 'changePassword']);

    Route::apiResource('sizes', SizeController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::apiResource('brands', BrandController::class)->only(['index', 'store', 'update', 'destroy']);

    Route::apiResource('products', ProductController::class);
    Route::post('/products/{product}/variants', [ProductController::class, 'addVariant']);
    Route::put('/product-variants/{productVariant}', [ProductVariantController::class, 'update']);
    Route::delete('/product-variants/{productVariant}', [ProductVariantController::class, 'destroy']);

    Route::apiResource('contacts', ContactController::class);

    Route::apiResource('leads', LeadController::class);
    Route::post('/leads/{lead}/convert', [LeadController::class, 'convert']);
    Route::post('/leads/quick-capture', [LeadController::class, 'quickCapture']);
    Route::apiResource('crm-tasks', CrmTaskController::class);

    Route::apiResource('quotations', QuotationController::class);
    Route::post('/quotations/{quotation}/approve', [QuotationController::class, 'approve']);
    Route::apiResource('invoices', InvoiceController::class);
    Route::apiResource('payments', PaymentController::class)->only(['index', 'store', 'show', 'update', 'destroy']);

    Route::apiResource('suppliers', SupplierController::class);
    Route::apiResource('raw-materials', RawMaterialController::class);
    Route::apiResource('purchase-orders', PurchaseOrderController::class);
    Route::post('/purchase-orders/{purchaseOrder}/receive', [PurchaseOrderController::class, 'receive']);

    Route::apiResource('production-orders', ProductionOrderController::class);
    Route::post('/production-orders/{productionOrder}/processes', [ProductionProcessController::class, 'store']);
    Route::post('/production-orders/{productionOrder}/items', [ProductionOrderItemController::class, 'store']);
    Route::put('/production-orders/{productionOrder}/items/{item}', [ProductionOrderItemController::class, 'update']);
    Route::delete('/production-orders/{productionOrder}/items/{item}', [ProductionOrderItemController::class, 'destroy']);
    Route::post('/production-orders/{productionOrder}/items/{item}/push-to-inventory', [ProductionOrderItemController::class, 'pushToInventory']);
    Route::get('/production-processes/stage-counts', [ProductionProcessController::class, 'stageCounts']);
    Route::apiResource('production-processes', ProductionProcessController::class)->only(['index', 'update', 'destroy']);
    Route::post('/production-processes/{productionProcess}/mark-delivered', [ProductionProcessController::class, 'markDelivered']);
    Route::post('/production-processes/{productionProcess}/import-missed-items', [ProductionProcessController::class, 'importMissedItems']);
    Route::post('/production-processes/bulk-move', [ProductionProcessController::class, 'bulkMove']);

    Route::apiResource('deliveries', DeliveryController::class);

    Route::post('/n8n/test', [N8nTestController::class, 'ping']);
    Route::get('/lookup/{code}', [LookupController::class, 'show']);
    Route::post('/chat/ask', [ChatProxyController::class, 'ask']);

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
