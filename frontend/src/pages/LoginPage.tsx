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
  Shirt,
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
  highlight: ('rack' | 'screen' | 'boxes' | 'chart')[]
}

const SLIDES: Slide[] = [
  {
    title: 'All-in-one ERP for garment manufacturing',
    text: 'Manage production, stock, purchase, sales, accounts and reports in one connected platform.',
    chips: ['Production', 'Purchase', 'Accounts', 'Reports'],
    highlight: ['rack', 'screen', 'boxes', 'chart'],
  },
  {
    title: 'Track every order from cutting to dispatch',
    text: 'See the live status of each production order at every stage, without chasing anyone for updates.',
    chips: ['Cutting', 'Stitching', 'Packing', 'Dispatch'],
    highlight: ['rack', 'boxes'],
  },
  {
    title: 'Live insights with smart automation',
    text: 'Dashboards, alerts and exportable reports keep your whole team on top of the numbers.',
    chips: ['Dashboards', 'Alerts', 'PDF & CSV', 'Automation'],
    highlight: ['screen', 'chart'],
  },
]

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 transition placeholder:text-slate-400 hover:border-slate-300 focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100'

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
    <div className="flex min-h-screen bg-white">
      {/* Form side */}
      <div className="flex w-full items-center justify-center px-4 py-10 sm:px-8 lg:w-[42%]">
        <div className="w-full max-w-[480px] rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_8px_40px_-12px_rgba(15,23,42,0.08)] sm:p-9">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 text-white shadow-lg shadow-sky-500/30">
              <Shirt className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Sign in to <span className="font-medium text-sky-600">ERP System</span>
            </h1>
            <p className="mt-2 text-sm text-slate-500">Enter your account details to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-800">
                Email / User ID
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
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
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-800">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:text-slate-700"
                >
                  {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <label className="flex w-fit cursor-pointer select-none items-center gap-2.5 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-sky-500"
              />
              Remember me
            </label>

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-400 px-4 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:from-sky-600 hover:to-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
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

          <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            Demo access
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={fillDemo}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm transition hover:border-sky-200 hover:bg-sky-50/50"
          >
            <span className="text-slate-500">
              {DEMO_EMAIL} / {DEMO_PASSWORD}
            </span>
            <span className="font-semibold text-sky-600">Use demo</span>
          </button>

          <div className="mt-7 space-y-3 text-center">
            <p className="text-sm text-slate-500">
              Streamlining your production, from planning to dispatch.
            </p>
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} Arun Kumar. All rights reserved.
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              <ShieldCheck className="h-3.5 w-3.5" />
              ERP System {APP_VERSION}
            </span>
          </div>
        </div>
      </div>

      {/* Showcase side */}
      <div className="relative hidden flex-1 overflow-hidden bg-gradient-to-br from-sky-50 via-slate-50 to-sky-100/60 p-8 lg:flex">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-10 h-96 w-96 rounded-full bg-cyan-100/60 blur-3xl" />

        <div className="relative flex w-full flex-col rounded-[2rem] border border-white bg-white/80 p-8 shadow-[0_20px_60px_-20px_rgba(14,116,144,0.15)] backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-100">
              <Sparkles className="h-4 w-4 text-sky-500" />
              Built for the garment industry
            </span>
            <div className="flex items-center gap-2">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSlide(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    i === slide ? 'w-9 bg-sky-500' : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="relative flex flex-1 items-center justify-center py-6">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous slide"
              className="absolute left-0 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-600 shadow-md ring-1 ring-slate-100 transition hover:text-sky-600"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Illustration */}
            <div className="h-[340px] w-full max-w-[560px] px-14 xl:h-[380px]">
              <LoginIllustration active={current.highlight} />
            </div>

            <button
              type="button"
              onClick={next}
              aria-label="Next slide"
              className="absolute right-0 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-600 shadow-md ring-1 ring-slate-100 transition hover:text-sky-600"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div key={`text-${slide}`} className="animate-fade-up text-center">
            <p className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-sky-600">
              <Sparkles className="h-4 w-4" />
              ERP System
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 xl:text-4xl">
              {current.title}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-slate-500">
              {current.text}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {current.chips.map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-100"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
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
