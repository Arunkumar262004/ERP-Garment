import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../api/client'
import type { User } from '../types'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../components/ToastProvider'
import Badge from '../components/Badge'

interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string
      errors?: Record<string, string[]>
    }
  }
}

function extractErrorMessage(error: unknown, fallback: string): string {
  const response = (error as ApiErrorResponse)?.response?.data
  if (response?.errors?.current_password?.[0]) return response.errors.current_password[0]
  if (response?.message) return response.message
  return fallback
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const { showToast } = useToast()

  const [profileForm, setProfileForm] = useState({ name: user?.name ?? '', email: user?.email ?? '' })
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  })

  const profileMutation = useMutation({
    mutationFn: async () => (await api.put<User>('/profile', profileForm)).data,
    onSuccess: (updatedUser) => {
      updateUser(updatedUser)
      showToast('Profile updated', 'success')
    },
    onError: (error: unknown) => {
      showToast(extractErrorMessage(error, 'Failed to update profile'), 'error')
    },
  })

  const passwordMutation = useMutation({
    mutationFn: async () => (await api.put('/profile/password', passwordForm)).data,
    onSuccess: () => {
      showToast('Password changed', 'success')
      setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' })
    },
    onError: (error: unknown) => {
      showToast(extractErrorMessage(error, 'Failed to change password'), 'error')
    },
  })

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-800">Profile Information</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            profileMutation.mutate()
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input
              type="text"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
            <div>{user?.role && <Badge value={user.role} />}</div>
          </div>
          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={profileMutation.isPending}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {profileMutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-800">Change Password</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            passwordMutation.mutate()
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Current Password</label>
            <input
              type="password"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">New Password</label>
            <input
              type="password"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Confirm New Password</label>
            <input
              type="password"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              value={passwordForm.new_password_confirmation}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirmation: e.target.value })}
            />
          </div>
          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={passwordMutation.isPending}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {passwordMutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
