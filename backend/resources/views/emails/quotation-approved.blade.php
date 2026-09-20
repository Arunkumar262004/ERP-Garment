<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; color: #222;">
    <p>Hi {{ $quotation->contact?->name }},</p>

    <p>Your quotation <strong>{{ $quotation->quotation_no }}</strong> has been approved.</p>

    <table cellpadding="6" style="border-collapse: collapse;">
        <tr>
            <td>Quotation No.</td>
            <td><strong>{{ $quotation->quotation_no }}</strong></td>
        </tr>
        <tr>
            <td>Total Amount</td>
            <td><strong>{{ number_format((float) $quotation->total, 2) }}</strong></td>
        </tr>
        <tr>
            <td>Status</td>
            <td><strong>{{ ucfirst($quotation->status) }}</strong></td>
        </tr>
    </table>

    <p>Thank you for your business.</p>
</body>
</html>
