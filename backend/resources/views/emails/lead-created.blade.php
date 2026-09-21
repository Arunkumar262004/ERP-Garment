<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; color: #222;">
    <p>Hi,</p>

    <p>A new lead has come in: <strong>{{ $lead->name }}</strong>{{ $lead->company_name ? " ({$lead->company_name})" : '' }}.</p>

    <table cellpadding="6" style="border-collapse: collapse;">
        <tr>
            <td>Lead No.</td>
            <td><strong>{{ $lead->lead_no }}</strong></td>
        </tr>
        <tr>
            <td>Email</td>
            <td>{{ $lead->email ?? '—' }}</td>
        </tr>
        <tr>
            <td>Phone</td>
            <td>{{ $lead->phone ?? '—' }}</td>
        </tr>
        <tr>
            <td>Source</td>
            <td>{{ ucfirst(str_replace('_', ' ', $lead->source)) }}</td>
        </tr>
        <tr>
            <td>Assigned To</td>
            <td>{{ $lead->assignee?->name ?? 'Unassigned' }}</td>
        </tr>
    </table>
</body>
</html>
