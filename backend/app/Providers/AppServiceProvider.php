<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     *
     * Listeners are never registered manually here — Laravel auto-discovers
     * every class under app/Listeners with a type-hinted handle(EventClass
     * $event) method. Registering one manually as well (as this file used to,
     * for QuotationApproved's two listeners) double-registers it: the same
     * listener runs twice per event, which silently double-sent the
     * quotation-approved customer email and n8n webhook on every approval.
     */
    public function boot(): void
    {
        //
    }
}
