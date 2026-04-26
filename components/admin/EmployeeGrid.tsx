'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Shield, User, Briefcase, ChevronDown } from 'lucide-react'
import { getStatusDotClass, getStatusLabel, getInitials, getAvatarBgClass, formatTimeAgo, formatBusyRemaining } from '@/lib/utils'
import { overrideStatus, updateEmployeeRole } from '@/app/admin/actions'
import type { UserProfile } from '@/lib/supabase/types'

const ROLE_ICONS = { admin: Shield, coordinator: Briefcase, employee: User }
const ROLE_OPTIONS = ['employee', 'coordinator', 'admin'] as const

interface Props {
  employees: UserProfile[]
  currentUserId: string
}

export default function EmployeeGrid({ employees, currentUserId }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const setStatus = async (userId: string, status: 'available' | 'busy' | 'important') => {
    setLoading(userId + status)
    setError(null)
    const res = await overrideStatus(userId, status)
    setLoading(null)
    if (res?.error) setError(res.error)
  }

  const setRole = async (userId: string, role: 'admin' | 'employee' | 'coordinator') => {
    setLoading(userId + 'role')
    setError(null)
    const res = await updateEmployeeRole(userId, role)
    setLoading(null)
    if (res?.error) setError(res.error)
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Employee</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Last Change</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Role</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Override</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map((emp) => {
              const RoleIcon = ROLE_ICONS[(emp.role as keyof typeof ROLE_ICONS) ?? 'employee'] ?? User
              const isLoading = loading?.startsWith(emp.id)
              const remaining = emp.status === 'busy' ? formatBusyRemaining(emp.busy_until) : null

              return (
                <tr key={emp.id} className={`hover:bg-slate-50 transition-colors ${isLoading ? 'opacity-60' : ''}`}>
                  {/* Employee */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                        {emp.avatar_url ? (
                          <Image src={emp.avatar_url} alt={emp.full_name ?? ''} width={32} height={32} className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center text-white text-xs font-bold ${getAvatarBgClass(emp.full_name)}`}>
                            {getInitials(emp.full_name)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {emp.full_name ?? 'Unnamed'}
                          {emp.id === currentUserId && (
                            <span className="ml-1.5 text-xs text-blue-600">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400">{emp.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${getStatusDotClass(emp.status)}`} />
                      <span className="text-slate-700">{getStatusLabel(emp.status)}</span>
                      {remaining && <span className="text-xs text-red-500">({remaining})</span>}
                    </div>
                  </td>

                  {/* Last change */}
                  <td className="px-4 py-3 text-slate-500">
                    {formatTimeAgo(emp.status_changed_at)}
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3">
                    <div className="relative flex items-center gap-1.5">
                      <RoleIcon className="w-3.5 h-3.5 text-slate-400" />
                      <select
                        value={emp.role ?? 'employee'}
                        onChange={(e) => setRole(emp.id, e.target.value as typeof ROLE_OPTIONS[number])}
                        disabled={isLoading}
                        className="text-sm text-slate-700 bg-transparent cursor-pointer border-0 pr-6 focus:outline-none appearance-none"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none absolute right-0" />
                    </div>
                  </td>

                  {/* Override */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {(['available', 'busy', 'important'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatus(emp.id, s)}
                          disabled={isLoading || emp.status === s}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                            s === 'available' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                            s === 'busy' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                            'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          }`}
                        >
                          {getStatusLabel(s)}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
