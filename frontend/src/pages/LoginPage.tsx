import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Loader2, Shirt } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'

const FEATURES = ['Production tracking', 'Contacts & CRM', 'Purchasing & stock', 'Live reports']

const DEMO_EMAIL = 'admin@erp.test'
const DEMO_PASSWORD = 'password'

const inputClass =
  'w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-900 focus:outline-none focus:ring-4 focus:ring-zinc-900/5'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState(DEMO_EMAIL)
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = () => {
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    setError('')
  }

  return (
    <div className="flex min-h-screen bg-white text-zinc-900">
      {/* Brand panel */}
      <aside className="relative hidden w-[44%] flex-col overflow-hidden bg-zinc-950 p-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(ellipse at 30% 40%, black 20%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 30% 40%, black 20%, transparent 75%)',
          }}
        />
        <div className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-white/[0.04] blur-3xl" />

        <div className="relative flex items-center gap-2.5 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-zinc-950">
            <Shirt className="h-4.5 w-4.5" />
          </div>
          <span className="text-base font-semibold tracking-tight">ERP System</span>
        </div>

        <div className="relative my-auto max-w-md py-16">
          <p className="mb-5 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            Garment ERP
          </p>
          <h2 className="text-4xl font-semibold leading-[1.15] tracking-tight text-white xl:text-5xl">
            Everything your
            <br />
            business runs on.
            <br />
            <span className="text-zinc-500">In one place.</span>
          </h2>

          <ul className="mt-12 space-y-3.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-zinc-300">
                <span className="h-px w-5 bg-zinc-600" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-zinc-600">
          © {new Date().getFullYear()} ERP System
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[360px]">
          <div className="mb-10 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-white">
              <Shirt className="h-4.5 w-4.5" />
            </div>
            <span className="text-base font-semibold tracking-tight">ERP System</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1.5 text-sm text-zinc-500">Welcome back. Enter your details to continue.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-zinc-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-2 text-zinc-400 transition hover:text-zinc-900"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 focus:outline-none focus:ring-4 focus:ring-zinc-900/15 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <div className="my-8 flex items-center gap-3 text-xs text-zinc-400">
            <span className="h-px flex-1 bg-zinc-100" />
            Demo access
            <span className="h-px flex-1 bg-zinc-100" />
          </div>

          <button
            type="button"
            onClick={fillDemo}
            className="flex w-full items-center justify-between rounded-lg border border-zinc-200 px-3.5 py-2.5 text-left text-sm transition hover:border-zinc-300 hover:bg-zinc-50"
          >
            <span className="font-mono text-xs text-zinc-500">
              {DEMO_EMAIL} · {DEMO_PASSWORD}
            </span>
            <span className="text-xs font-medium text-zinc-900">Fill</span>
          </button>
        </div>
      </main>
    </div>
  )
}
