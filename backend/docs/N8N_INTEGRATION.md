# n8n Automation Integration — Quotation Approved

This document covers the "Quotation Approved" automation POC: Laravel fires a
webhook to n8n whenever a quotation is approved, and n8n takes it from there
(Slack, email, Sheets, CRM, etc.). It's built as a reusable pattern — adding
the next automation (PO received, invoice paid, ...) means repeating the same
five pieces with a different trigger point.

## 1. Architecture

```
QuotationController::approve()
   → DB::transaction(update status=approved, stamp approval_event_id)
   → event(new QuotationApproved($quotation))      [ShouldDispatchAfterCommit]
        ↓ (fires only after the transaction commits, two listeners run)
        │
        ├─→ SendQuotationApprovedWebhook listener builds the payload
        │      → SendN8nWebhook::dispatch(...)      [queued job, retries 3x]
        │      → N8nService::send()                 [HTTP POST, never throws]
        │      → n8n Webhook node
        │           → IF: secret valid
        │           → IF: status == "approved"
        │           → Code: prepare notification data
        │           → (your fan-out: Slack / Sheets / CRM / SMS)
        │
        └─→ SendQuotationApprovedEmail listener      [direct Laravel email,
               → QuotationApprovedMail (queued)        no n8n involved]
               → customer's email on file (skipped, logged, if none)
```

Two independent automations fire off the same event: an **external** one
(n8n webhook, for fan-out you don't want to hard-code into Laravel) and an
**internal** one (a direct email via Laravel's own mailer, using `MAIL_MAILER`
from `.env` — `log` in local dev, so the email is visible in
`storage/logs/laravel.log` without needing real SMTP). Both are queued, so
neither can slow down or fail the approval request. Laravel stays the source
of truth for all business rules; n8n never touches the database.

## 2. Files changed / added

| File | Change |
|---|---|
| `backend/.env.example` | added `N8N_QUOTATION_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET` |
| `backend/config/services.php` | added `n8n` config block |
| `backend/database/migrations/2026_09_20_160000_add_approval_fields_to_quotations_table.php` | new — adds `approved_at`, `approval_event_id` (unique) to `quotations` |
| `backend/app/Models/Quotation.php` | added the two new columns to `#[Fillable]` and casts |
| `backend/app/Services/N8nService.php` | new — HTTP client wrapper, never throws, logs safely |
| `backend/app/Jobs/SendN8nWebhook.php` | new — generic queued job, retries with backoff (10s/30s/60s), reusable for any future event |
| `backend/app/Events/QuotationApproved.php` | new — `ShouldDispatchAfterCommit` event |
| `backend/app/Listeners/SendQuotationApprovedWebhook.php` | new — builds the payload, dispatches the job |
| `backend/app/Http/Controllers/Api/QuotationController.php` | added `approve()` action (idempotent) |
| `backend/app/Http/Controllers/Api/N8nTestController.php` | new — protected connectivity-test endpoint |
| `backend/app/Mail/QuotationApprovedMail.php` | new — queued Mailable sent to the customer on approval |
| `backend/app/Listeners/SendQuotationApprovedEmail.php` | new — sends the mail, skips (and logs) if the contact has no email |
| `backend/resources/views/emails/quotation-approved.blade.php` | new — email body |
| `backend/app/Providers/AppServiceProvider.php` | registers both listeners on `QuotationApproved` |
| `backend/routes/api.php` | added `POST /quotations/{quotation}/approve` and `POST /n8n/test` |
| `backend/tests/Feature/QuotationApprovalTest.php` | new — 12 tests covering approval, payload shape, idempotency, outage handling, auth, and the email |

**Nothing existing was changed in business logic.** The generic `PUT /quotations/{quotation}`
endpoint still works exactly as before (covered by a regression test) — `approve()`
is an additional, dedicated action, not a replacement.

## 3. Environment variables

Add to your local `backend/.env` (never commit real values):

```env
N8N_QUOTATION_WEBHOOK_URL=https://your-n8n-instance/webhook/quotation-approved
N8N_WEBHOOK_SECRET=a-long-random-shared-secret
```

If `N8N_QUOTATION_WEBHOOK_URL` is left empty, the service logs a warning and
skips delivery — it will never break quotation approval.

## 4. Setting up the n8n workflow (n8n dashboard, not Laravel)

If you don't have n8n running yet:

```sh
npx n8n
```

This starts n8n locally at `http://localhost:5678` (default login setup on first visit).

### 4.1 Create the workflow

1. Open the n8n editor → **New Workflow**.
2. Name it `Quotation Approved`.

### 4.2 Add the Webhook node (trigger)

1. Add a **Webhook** node as the first node.
2. Configure:
   - **HTTP Method**: `POST`
   - **Path**: `quotation-approved` (or anything — just match it in your `.env`)
   - **Respond**: `Immediately` (so Laravel isn't kept waiting on your downstream logic)
   - **Response Code**: `200`
3. Click **Listen for Test Event** — n8n shows you a **Test URL** you can call immediately.

### 4.3 Add the secret check (IF node — secret validation)

n8n's Webhook node exposes the incoming request headers as `{{$json.headers}}`.

1. Add an **IF** node after the Webhook node.
2. Condition: `{{$json.headers["x-n8n-webhook-secret"]}}` **equals** the value you put in `N8N_WEBHOOK_SECRET`.
   - Put the secret in an n8n **Credential** or a workflow **Static Data**/environment variable rather than typing it in plain text into the node, so it isn't visible to anyone who can view the workflow.
3. **True branch** → continue. **False branch** → a **NoOp**/**Respond to Webhook** node returning `401`.

### 4.4 Add the status IF node

1. Add a second **IF** node (after the secret check passes).
2. Condition: `{{$json.body.status}}` **equals** `approved` (see the payload shape below).

### 4.5 Add the Code node (prepare notification data)

On the **true** branch, add a **Code** node:

```javascript
const body = $input.first().json.body;

return [{
  json: {
    event_id: body.event_id,
    quotation_id: body.quotation_id,
    customer_name: body.customer_name,
    total_amount: body.total_amount,
    message: `Quotation #${body.quotation_id} for ${body.customer_name} was approved — total ₹${body.total_amount}.`,
  },
}];
```

From here, wire in whatever the business actually wants: a **Slack** node, an
**Email (SMTP)** node, a **Google Sheets** append, or an HTTP call back into
another system. That fan-out logic lives entirely in n8n — Laravel doesn't
need to know it exists.

### 4.6 Payload shape Laravel actually sends

```json
{
  "event": "quotation.approved",
  "event_id": "6f2c1b0a-....-....-....-............",
  "quotation_id": 1025,
  "customer_name": "ABC Garments",
  "total_amount": 125000,
  "status": "approved"
}
```

Header: `X-N8N-Webhook-Secret: <your secret>`

(This ERP's quotation status enum is `draft/sent/approved/rejected/expired`.)

### 4.7 Testing the webhook

1. With the workflow open and **Listen for Test Event** active, use the **Test URL** n8n shows you.
2. From Laravel, either:
   - Call `POST /api/quotations/{id}/approve` on a real quotation, or
   - Use the connectivity-test endpoint `POST /api/n8n/test` (see §6) — but point `N8N_QUOTATION_WEBHOOK_URL` at the **test** URL first.
3. Confirm the execution appears in n8n's **Executions** log with the expected JSON body and that your IF/Code nodes evaluate correctly.

### 4.8 Activating the workflow

1. Toggle **Active** (top right of the workflow editor).
2. n8n now shows a **Production URL** (different from the Test URL — the Test URL only works while you're actively watching for one test event).
3. Copy the **Production URL** into `N8N_QUOTATION_WEBHOOK_URL` in your real `.env` (or your hosting platform's environment variables).
4. Restart/redeploy Laravel (or just `php artisan config:clear` if config is cached) so it picks up the new env value.

## 5. Testing locally

```sh
# 1. Install and run migrations
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate

# 2. Set the two n8n env vars in .env, pointing at your n8n Test URL
# N8N_QUOTATION_WEBHOOK_URL=http://localhost:5678/webhook-test/quotation-approved
# N8N_WEBHOOK_SECRET=some-local-secret

# 3. Run the queue worker (approval webhooks are dispatched async)
php artisan queue:work

# 4. In another terminal, serve the app
php artisan serve
```

Run the automated tests (these use `Http::fake()` so they never call a real n8n instance):

```sh
php artisan test --filter=QuotationApprovalTest
# or the full suite
php artisan test
```

Check code style:

```sh
vendor/bin/pint --test
```

## 6. Testing with Postman

**Login** (get a Sanctum token):

```
POST http://localhost:8000/api/login
Body (json): { "email": "you@example.com", "password": "..." }
```

Copy the `token` from the response, then set an `Authorization: Bearer <token>`
header on the requests below.

**Approve a quotation:**

```
POST http://localhost:8000/api/quotations/1/approve
Authorization: Bearer <token>
```

Expect: `200 OK` with the quotation JSON, `status: "approved"`. Check your
`queue:work` terminal (or n8n's Executions tab) for the webhook delivery.

**Connectivity test (no real quotation needed):**

```
POST http://localhost:8000/api/n8n/test
Authorization: Bearer <token>
Body (json, optional): { "message": "ping from Postman" }
```

Expect: `200 { "status": "sent" }` if n8n received it, or `502 { "status": "failed", ... }`
if the webhook URL is unreachable/misconfigured — check `storage/logs/laravel.log`
for the underlying reason (this is intentionally not exposed in the API response).

## 7. Troubleshooting connection failures

| Symptom | Likely cause | Fix |
|---|---|---|
| Approval works but nothing arrives in n8n | `N8N_QUOTATION_WEBHOOK_URL` empty, or `queue:work` isn't running | Check `.env`, run `php artisan queue:work`, check `storage/logs/laravel.log` for `N8n webhook skipped` |
| n8n shows a 401 in its execution log | Secret header mismatch | Confirm `N8N_WEBHOOK_SECRET` matches what the IF node compares against |
| Webhook works in n8n's Test URL but not in production | Workflow not **Active**, or still pointing at the Test URL | Activate the workflow, switch env to the Production URL |
| Approval request itself fails with a 500 | This should not happen — webhook delivery failures are caught inside `N8nService` and never propagate. If it does, it's a bug — check the stack trace, it's not n8n-related | File it as a real bug, not an n8n outage |
| Duplicate webhooks for one approval | Shouldn't happen — `approve()` is a no-op on an already-approved quotation. If seen, check for retried client requests racing before the first `update()` commits | n8n workflows should still dedupe by `event_id` defensively |

## 8. Security considerations

- The webhook secret is sent as a custom header (`X-N8N-Webhook-Secret`), not
  in the URL or body, so it doesn't leak into server access logs.
- `N8nService` never logs the secret, the full payload, or raw response bodies —
  only event name, event ID, and HTTP status.
- The n8n test endpoint (`/api/n8n/test`) sits behind `auth:sanctum`, same as
  every other API route in this app — no new unauthenticated surface was added.
- Delivery uses a 5-second timeout so a hung n8n instance can't tie up a queue
  worker indefinitely.
- n8n should validate the secret header on every request (see §4.3) — without
  that check, anyone who discovers the webhook URL could inject fake
  "quotation approved" events into your automation.
- This is HTTP, not HMAC-signed-body verification — sufficient for a POC/internal
  integration. For a public-internet n8n instance handling sensitive data, consider
  upgrading to an HMAC signature over the raw body instead of a static shared secret.

## 9. How this works in production

1. A user approves a quotation through the UI → `POST /quotations/{id}/approve`.
2. The status change commits to the database and the API responds immediately —
   this response never waits on n8n.
3. The webhook job lands on the `database` queue (this project's configured
   `QUEUE_CONNECTION`) and is picked up by a running `php artisan queue:work`
   (or `queue:listen`) process — typically run under Supervisor or as a systemd
   service in production, not manually in a terminal.
4. If n8n is briefly unreachable, the job retries after 10s, 30s, then 60s. If
   it still fails, it's logged and moved to Laravel's `failed_jobs` table
   (inspect with `php artisan queue:failed`) — it does not retry forever, and
   it never re-touches the quotation.
5. n8n receives the event, validates the secret, checks status, and fans out
   to whatever the business actually needs (Slack, email, spreadsheet, CRM).

## 10. Extending this to other modules

The same five pieces (Event → Listener → `SendN8nWebhook` job → `N8nService`
→ n8n) work for any other status-driven automation in this ERP. To add one:

1. Pick the trigger point (e.g. `PurchaseOrderController::receive()`).
2. Add an idempotency field if the action can't naturally be made idempotent already.
3. Create an event implementing `ShouldDispatchAfterCommit` (e.g. `PurchaseOrderReceived`).
4. Create a listener that builds the event-specific payload and dispatches `SendN8nWebhook::dispatch($payload, $webhookUrl)`.
5. Register the listener in `AppServiceProvider::boot()`.
6. Add a matching IF/Switch branch in n8n (or a separate workflow with its own webhook path).

No changes to `N8nService` or `SendN8nWebhook` are needed — they're already generic.

## 11. Known limitations of this POC

- Delivery is at-least-once, not exactly-once: a job can theoretically succeed
  at n8n but fail to record that locally (e.g. crash between HTTP success and
  job completion) and get retried. n8n workflows should treat `event_id` as an
  idempotency key if this matters for a downstream side effect (e.g. don't
  send a second email for the same `event_id`).
- There's no per-role authorization on `approve()` — any authenticated user can
  approve a quotation, matching every other quotation endpoint today. This app
  has no policy/permission system yet (`role` is a plain enum column); adding
  one is a separate piece of work, not part of this integration.
- The secret is a static shared value, not per-request HMAC — see §8.
