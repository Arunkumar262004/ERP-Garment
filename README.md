# ERP System

Core architecture for a garment-manufacturing ERP: dashboard, contacts (B2B / B2C / employees), CRM (leads & tasks), accounts (quotations, invoices, payments), production (orders with a stitching → printing → washing → packing process pipeline), purchase (raw materials, suppliers, purchase orders), delivery tracking, and module-wise reports.

**Stack:** React (Vite + TypeScript + Tailwind) · Laravel (PHP) API · MySQL · Docker

## Quick start

```
docker compose up --build
```

That single command builds and starts everything: MySQL, the Laravel API, and the React dev server. On first run it also installs dependencies inside the containers, runs migrations, and seeds demo data — this can take a few minutes; subsequent runs are fast.

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api
- Demo login: `admin@erp.test` / `password`

Stop with `docker compose down` (add `-v` to also wipe the MySQL volume).

If ports 8000, 5173, or 3306 are already in use on your machine, copy `.env.example` to `.env` in the project root and change `BACKEND_PORT` / `FRONTEND_PORT` / `DB_FORWARD_PORT`.

## Project layout

```
backend/    Laravel API (contacts, CRM, accounts, production, purchase, delivery, reports)
frontend/   React + TypeScript SPA
docker-compose.yml
```

## Modules

- **Dashboard** — KPIs across every module plus a revenue trend chart.
- **Contacts** — unified B2B, B2C, and employee records.
- **CRM** — leads with source/status pipeline, tasks, and lead → quotation conversion.
- **Accounts** — quotations, invoices (with line items and tax), and payments against invoices.
- **Production** — orders with a configurable process pipeline (cutting, stitching, printing, washing, packing, quality check), each stage individually tracked.
- **Purchase** — suppliers, raw materials (with stock/reorder levels), and purchase orders with receiving.
- **Delivery** — dispatch and delivery tracking per production order.
- **Reports** — module-wise reports (orders, B2B, B2C, CRM, production, purchase, accounts, delivery).

## Local development without Docker

Backend (requires PHP 8.3 + Composer):
```
cd backend
composer install
php artisan migrate --seed
php artisan serve
```

Frontend (requires Node 20+):
```
cd frontend
npm install
npm run dev
```
