<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; color: #222;">
    <p>Hi {{ $order->contact?->name }},</p>

    <p>Order <strong>{{ $order->order_no }}</strong> is now complete.</p>

    <table cellpadding="6" style="border-collapse: collapse;">
        <tr>
            <td>Order No.</td>
            <td><strong>{{ $order->order_no }}</strong></td>
        </tr>
        <tr>
            <td>Customer</td>
            <td>{{ $order->contact?->name }}</td>
        </tr>
        <tr>
            <td>Quantity</td>
            <td>{{ $order->total_quantity }}</td>
        </tr>
        <tr>
            <td>Status</td>
            <td><strong>{{ ucfirst($order->status) }}</strong></td>
        </tr>
    </table>

    <p>Thank you for your business.</p>
</body>
</html>
