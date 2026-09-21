import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { MessageCircle, Send, X } from 'lucide-react'
import { api } from '../api/client'

interface ChatMessage {
  role: 'user' | 'bot'
  text: string
}

const WELCOME: ChatMessage = {
  role: 'bot',
  text: "Hi! Ask me about any order or contact — e.g. \"what stage is PRD-00003 in?\" or \"what is the company of B2B-00011?\"",
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  const askMutation = useMutation({
    mutationFn: async (message: string) => (await api.post<{ reply: string }>('/chat/ask', { message })).data,
    onSuccess: (data) => {
      setMessages((m) => [...m, { role: 'bot', text: data.reply }])
    },
    onError: () => {
      setMessages((m) => [...m, { role: 'bot', text: "Sorry, I couldn't reach the assistant right now. Please try again." }])
    },
  })

  function handleSend() {
    const text = input.trim()
    if (!text || askMutation.isPending) return
    setMessages((m) => [...m, { role: 'user', text }])
    setInput('')
    askMutation.mutate(text)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[32rem] w-96 max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-brand-600 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">ERP Assistant</p>
              <p className="text-xs text-brand-100">Ask about any order or contact</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-brand-100 transition hover:bg-brand-700 hover:text-white"
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'rounded-br-sm bg-brand-600 text-white'
                      : 'rounded-bl-sm border border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {askMutation.isPending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-400">
                  Thinking…
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-slate-200 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend()
              }}
              placeholder="Type a question…"
              className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm outline-none focus:border-brand-500"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || askMutation.isPending}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition hover:bg-brand-700"
        aria-label="Toggle chat"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  )
}
