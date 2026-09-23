import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Shirt,
  Truck,
  Users,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'

const FEATURES = [
  { icon: Shirt, title: 'Production', text: 'Track orders from cutting to dispatch.' },
  { icon: Users, title: 'Contacts & CRM', text: 'Customers, leads and tasks in one place.' },
  { icon: Truck, title: 'Purchasing', text: 'Manage suppliers and incoming stock.' },
  { icon: BarChart3, title: 'Reports', text: 'Live dashboards and exportable reports.' },
]

const DEMO_EMAIL = 'admin@erp.test'
const DEMO_PASSWORD = 'password'

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
    <div className="flex min-h-screen bg-white">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-600 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-[28rem] w-[28rem] rounded-full bg-indigo-400/20 blur-3xl" />

        <div className="relative flex items-center gap-3 text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
            <Shirt className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">ERP System</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight text-white">
            Run your whole business from one dashboard.
          </h2>
          <p className="mt-4 text-brand-100">
            Production, sales, purchasing and accounts — connected and automated.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm"
              >
                <Icon className="h-5 w-5 text-white" />
                <p className="mt-3 text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-brand-100">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-brand-200">
          © {new Date().getFullYear()} ERP System. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center bg-slate-50 px-4 py-12 lg:w-1/2 lg:bg-white">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Shirt className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold text-slate-900">ERP System</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to continue to your workspace.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 rounded-lg border border-dashed border-brand-200 bg-brand-50 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-brand-800">
                <p className="font-semibold">Demo account</p>
                <p className="mt-0.5 text-brand-700">
                  {DEMO_EMAIL} / {DEMO_PASSWORD}
                </p>
              </div>
              <button
                type="button"
                onClick={fillDemo}
                className="shrink-0 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100"
              >
                Use demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
