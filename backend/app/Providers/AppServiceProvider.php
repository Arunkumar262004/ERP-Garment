<?php

namespace App\Providers;

use App\Events\QuotationApproved;
use App\Listeners\SendQuotationApprovedEmail;
use App\Listeners\SendQuotationApprovedWebhook;
use Illuminate\Support\Facades\Event;
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
     */
    public function boot(): void
    {
        Event::listen(QuotationApproved::class, SendQuotationApprovedWebhook::class);
        Event::listen(QuotationApproved::class, SendQuotationApprovedEmail::class);
    }
}
