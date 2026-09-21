<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\N8nService;
use Illuminate\Http\Request;

class ChatProxyController extends Controller
{
    /**
     * Forward a chat message to the n8n AI Agent and return its reply.
     * Laravel never talks to the LLM directly — n8n owns that; this just
     * keeps the n8n webhook internal to the Docker network instead of
     * exposing it to the browser.
     */
    public function ask(Request $request, N8nService $n8n)
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:1000'],
        ]);

        $reply = $n8n->askChat($data['message'], 'erp-user-'.$request->user()->id);

        if ($reply === null) {
            return response()->json([
                'reply' => "Sorry, I couldn't reach the assistant right now. Please try again in a moment.",
            ], 502);
        }

        return response()->json(['reply' => $reply]);
    }
}
