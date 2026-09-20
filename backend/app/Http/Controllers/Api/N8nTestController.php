<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\N8nService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class N8nTestController extends Controller
{
    /**
     * Send a one-off test payload to the configured n8n webhook so the
     * integration can be verified without approving a real quotation.
     */
    public function ping(Request $request, N8nService $n8n)
    {
        $data = $request->validate([
            'message' => ['nullable', 'string', 'max:255'],
        ]);

        $delivered = $n8n->send([
            'event' => 'n8n.connectivity_test',
            'event_id' => (string) Str::uuid(),
            'message' => $data['message'] ?? 'Laravel connectivity test',
            'triggered_by' => $request->user()->id,
            'triggered_at' => now()->toIso8601String(),
        ]);

        if (! $delivered) {
            return response()->json([
                'status' => 'failed',
                'message' => 'Could not reach the n8n webhook. Check the logs for details.',
            ], 502);
        }

        return response()->json(['status' => 'sent']);
    }
}
