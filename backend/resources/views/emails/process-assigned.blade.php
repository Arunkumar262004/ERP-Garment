<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; color: #222;">
    <p>Hi {{ $process->employee?->name }},</p>

    <p>You've been assigned to the <strong>{{ \App\Models\ProductionOrder::STAGE_LABELS[$process->process_type] ?? $process->process_type }}</strong> stage on order <strong>{{ $process->productionOrder->order_no }}</strong>.</p>

    <table cellpadding="6" style="border-collapse: collapse;">
        <tr>
            <td>Order No.</td>
            <td><strong>{{ $process->productionOrder->order_no }}</strong></td>
        </tr>
        <tr>
            <td>Customer</td>
            <td>{{ $process->productionOrder->contact?->name }}</td>
        </tr>
        <tr>
            <td>Due Date</td>
            <td>{{ $process->due_date?->format('d-m-Y') ?? 'Not set' }}</td>
        </tr>
    </table>
</body>
</html>
