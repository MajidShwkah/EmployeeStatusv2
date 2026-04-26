'use client'

import { useActionState, useState, useEffect } from 'react'
import { Plus, Trash2, Power } from 'lucide-react'
import { createCycle, toggleCycleActive, deleteCycle } from '@/app/coordinator/actions'
import type { OperationCycle } from '@/lib/supabase/types'

interface Props {
  cycles: OperationCycle[]
}

export default function OPCManager({ cycles }: Props) {
  const [createState, createAction, createPending] = useActionState(createCycle, null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    if (createState?.success) setShowForm(false)
  }, [createState])

  const handleToggle = async (id: string, activate: boolean) => {
    setLoading(id + 'toggle')
    await toggleCycleActive(id, activate)
    setLoading(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this OPC cycle and all its objectives?')) return
    setLoading(id + 'delete')
    await deleteCycle(id)
    setLoading(null)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-700">Operation Cycles</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Cycle
        </button>
      </div>

      {showForm && (
        <form
          action={createAction}
          className="bg-slate-50 rounded-xl p-4 mb-4 flex flex-col gap-3"
        >
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Cycle Number</label>
              <input
                type="number"
                name="cycle_number"
                min={1}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400"
                placeholder="12"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
              <input
                type="date"
                name="start_date"
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
              <input
                type="date"
                name="end_date"
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
          {createState?.error && <p className="text-sm text-red-600">{createState.error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPending}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
            >
              {createPending ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {cycles.length === 0 ? (
        <p className="text-slate-400 text-sm py-4 text-center">No cycles yet. Create your first OPC.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {cycles.map((c) => (
            <div
              key={c.id}
              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                c.is_active ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white'
              } ${loading?.startsWith(c.id) ? 'opacity-60' : ''}`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">OPC #{c.cycle_number}</span>
                  {c.is_active && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Active</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {c.start_date} → {c.end_date}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(c.id, !c.is_active)}
                  disabled={!!loading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors disabled:opacity-50 ${
                    c.is_active
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  {c.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={!!loading}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
