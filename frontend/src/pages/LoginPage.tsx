import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import LoginIllustration from '../components/LoginIllustration'

const DEMO_EMAIL = 'admin@erp.test'
const DEMO_PASSWORD = 'password'
const REMEMBER_KEY = 'erp_remember_email'
const APP_VERSION = 'V 1.0.0'

interface Slide {
  title: string
  text: string
  chips: string[]
}

const SLIDES: Slide[] = [
  {
    title: 'All-in-one ERP for garment manufacturing',
    text: 'Manage production, stock, purchase, sales, accounts and reports in one connected platform.',
    chips: ['Production', 'Purchase', 'Accounts', 'Reports'],
  },
  {
    title: 'Track every order from cutting to dispatch',
    text: 'See the live status of each production order at every stage, without chasing anyone for updates.',
    chips: ['Cutting', 'Stitching', 'Packing', 'Dispatch'],
  },
  {
    title: 'Live insights with smart automation',
    text: 'Dashboards, alerts and exportable reports keep your whole team on top of the numbers.',
    chips: ['Dashboards', 'Alerts', 'PDF & CSV', 'Automation'],
  },
]

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 transition placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100'

function readRememberedEmail() {
  try {
    return localStorage.getItem(REMEMBER_KEY) ?? ''
  } catch {
    return ''
  }
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState(readRememberedEmail)
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(() => readRememberedEmail() !== '')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 5000)
    return () => clearInterval(id)
  }, [slide])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      try {
        if (remember) localStorage.setItem(REMEMBER_KEY, email)
        else localStorage.removeItem(REMEMBER_KEY)
      } catch {
        // storage unavailable — ignore
      }
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

  const prev = () => setSlide((s) => (s - 1 + SLIDES.length) % SLIDES.length)
  const next = () => setSlide((s) => (s + 1) % SLIDES.length)
  const current = SLIDES[slide]

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white to-primary-50/40 lg:h-screen">
      {/* Form side */}
      <div className="flex w-full items-center justify-center overflow-y-auto px-4 py-8 lg:w-[40%]">
        <div className="w-full max-w-[380px] rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.08)] sm:p-7">
          <div className="text-center">
            <img
              src="/sales-fav.jpg"
              alt="ERP System"
              className="mx-auto mb-4 h-12 w-12 rounded-xl object-cover shadow-md ring-1 ring-slate-200"
            />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Sign in to <span className="text-primary-600">ERP System</span>
            </h1>
            <p className="mt-1 text-[13px] text-slate-500">Enter your account details to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                Email / User ID
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:text-slate-700"
                >
                  {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <label className="flex w-fit cursor-pointer select-none items-center gap-2 text-[13px] text-slate-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 accent-primary-600"
              />
              Remember me
            </label>

            {error && (
              <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[13px] text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-600/20 transition hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-100 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Logging in…
                </>
              ) : (
                <>
                  Log in
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <button
            type="button"
            onClick={fillDemo}
            className="mt-4 flex w-full items-center justify-between rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs transition hover:border-primary-200 hover:bg-primary-50/50"
          >
            <span className="text-slate-500">
              Demo: {DEMO_EMAIL} / {DEMO_PASSWORD}
            </span>
            <span className="font-semibold text-primary-600">Use demo</span>
          </button>

          <div className="mt-5 flex items-center justify-center gap-2 border-t border-slate-100 pt-4 text-[11px] text-slate-400">
            <span>© {new Date().getFullYear()} Arun Kumar. All rights reserved.</span>
            <span className="h-3 w-px bg-slate-200" />
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              {APP_VERSION}
            </span>
          </div>
        </div>
      </div>

      {/* Showcase side */}
      <div className="relative hidden flex-1 overflow-hidden bg-gradient-to-br from-primary-50 via-fuchsia-50/40 to-indigo-50/70 p-5 lg:flex">
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-primary-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-fuchsia-100/50 blur-3xl" />

        <div className="relative flex w-full flex-col rounded-3xl border border-white bg-white/80 p-6 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.15)] backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-100">
              <Sparkles className="h-3.5 w-3.5 text-primary-600" />
              Built for the garment industry
            </span>
            <div className="flex items-center gap-1.5">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSlide(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === slide ? 'w-7 bg-primary-600' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center py-4">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous slide"
              className="absolute left-0 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:text-primary-600"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="h-full max-h-[300px] w-full max-w-[420px]">
              <LoginIllustration variant={slide} />
            </div>

            <button
              type="button"
              onClick={next}
              aria-label="Next slide"
              className="absolute right-0 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:text-primary-600"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div key={slide} className="animate-fade-up text-center">
            <p className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-primary-600">
              <Sparkles className="h-3 w-3" />
              ERP System
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 xl:text-2xl">
              {current.title}
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-[13px] leading-relaxed text-slate-500">
              {current.text}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {current.chips.map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-100"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary-600" />
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
