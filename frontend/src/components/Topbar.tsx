import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, LogOut, Menu, Search, UserCircle } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useDashboard } from '../hooks/useDashboard'
import { computeAlerts, type AlertSeverity } from '../lib/alerts'
import type { AppNotification, Paginated } from '../types'

const SEVERITY_DOT: Record<AlertSeverity, string> = {
  critical: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-sky-500',
  accent: 'bg-brand-500',
}

function useClickOutside(onOutside: () => void) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onOutside])

  return ref
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export default function Topbar({ title, onToggleSidebar }: { title: string; onToggleSidebar: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data } = useDashboard()
  const alerts = data ? computeAlerts(data) : []

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get<Paginated<AppNotification>>('/notifications')).data.data,
    refetchInterval: 60000,
  })

  const unreadNotifications = (notifications ?? []).filter((n) => !n.read_at)

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const notifRef = useClickOutside(() => setNotifOpen(false))
  const userRef = useClickOutside(() => setUserOpen(false))

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleNotificationClick = (n: AppNotification) => {
    if (!n.read_at) markReadMutation.mutate(n.id)
    setNotifOpen(false)
    if (n.data.url) navigate(n.data.url)
  }

  const badgeCount = unreadNotifications.length + alerts.length

  const initials = (user?.name ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex flex-1 items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>
        <h1 className="hidden text-lg font-semibold text-slate-800 sm:block">{title}</h1>
        <div className="relative ml-auto hidden max-w-sm flex-1 sm:block">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search here"
            className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-9 pr-14 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
            Ctrl K
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {badgeCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {badgeCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 z-20 mt-2 max-h-[28rem] w-80 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
              <div className="flex items-center justify-between px-2 py-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notifications</p>
                {unreadNotifications.length > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    className="text-xs font-medium text-brand-600 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              {(notifications ?? []).length === 0 && (
                <p className="px-2 py-3 text-sm text-slate-400">No notifications yet.</p>
              )}
              {notifications?.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left text-sm hover:bg-slate-50 ${
                    !n.read_at ? 'bg-brand-50/50' : ''
                  }`}
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${!n.read_at ? 'bg-brand-500' : 'bg-slate-200'}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-slate-700">{n.data.title}</span>
                    <span className="block truncate text-xs text-slate-400">{n.data.message}</span>
                    <span className="block text-[11px] text-slate-300">{timeAgo(n.created_at)}</span>
                  </span>
                </button>
              ))}

              <p className="mt-2 border-t border-slate-100 px-2 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Alerts &amp; Reminders
              </p>
              {alerts.length === 0 && <p className="px-2 py-3 text-sm text-slate-400">You&apos;re all caught up.</p>}
              {alerts.map((alert) => (
                <Link
                  key={alert.id}
                  to={alert.href}
                  onClick={() => setNotifOpen(false)}
                  className="flex items-start gap-2.5 rounded-md px-2 py-2 text-sm hover:bg-slate-50"
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[alert.severity]}`} />
                  <span>
                    <span className="block font-medium text-slate-700">{alert.label}</span>
                    <span className="block text-xs text-slate-400">{alert.description}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserOpen((v) => !v)}
            className="flex items-center gap-2 rounded-md p-1.5 pr-2 hover:bg-slate-100"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
              {initials}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium leading-tight text-slate-800">{user?.name}</span>
              <span className="block text-xs capitalize leading-tight text-slate-400">{user?.role}</span>
            </span>
            <ChevronDown size={14} className="hidden text-slate-400 sm:block" />
          </button>
          {userOpen && (
            <div className="absolute right-0 z-20 mt-2 w-44 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg">
              <Link
                to="/profile"
                onClick={() => setUserOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                <UserCircle size={16} /> My Profile
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
