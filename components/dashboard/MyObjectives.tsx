'use client'

import { useEffect, useState } from 'react'
import { Target } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface KR {
  id: string
  description: string
  progress: number
}

interface ObjectiveItem {
  id: string
  title: string
  cycle_number: number
  role: 'owner' | 'custodian'
  key_results: KR[]
}

interface Props {
  objectives: ObjectiveItem[]
}

function krColor(pct: number) {
  if (pct >= 80) return { bar: '#16a34a', text: '#15803d' }
  if (pct >= 50) return { bar: '#2563eb', text: '#1d4ed8' }
  return { bar: '#f97316', text: '#c2410c' }
}

export default function MyObjectives({ objectives: initial }: Props) {
  const [objectives, setObjectives] = useState<ObjectiveItem[]>(initial)

  useEffect(() => {
    const supabase = createClient()
    const krIds = initial.flatMap((o) => o.key_results.map((kr) => kr.id))
    if (!krIds.length) return

    const ch = supabase
      .channel('dashboard-kr-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'key_results' },
        (payload) => {
          const row = payload.new as { id: string; progress: number; description: string }
          if (!krIds.includes(row.id)) return
          setObjectives((prev) =>
            prev.map((obj) => ({
              ...obj,
              key_results: obj.key_results.map((kr) =>
                kr.id === row.id
                  ? { ...kr, progress: row.progress, description: row.description }
                  : kr
              ),
            }))
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [initial])

  if (objectives.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-700">My Objectives</h2>
        </div>
        <p className="text-slate-400 text-sm">You have no assigned objectives in the active OPC.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-orange-500" />
        <h2 className="text-lg font-semibold text-slate-700">My Objectives</h2>
      </div>

      <div className="flex flex-col gap-4">
        {objectives.map((obj) => (
          <div key={obj.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="font-semibold text-slate-900">{obj.title}</p>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                  OPC #{obj.cycle_number}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                  obj.role === 'owner'
                    ? 'text-purple-700 bg-purple-50 border-purple-200'
                    : 'text-slate-600 bg-slate-100 border-slate-200'
                }`}>
                  {obj.role === 'owner' ? 'Owner' : 'Custodian'}
                </span>
              </div>
            </div>

            {obj.key_results.length > 0 && (
              <div className="flex flex-col gap-3 mt-3">
                {obj.key_results.map((kr) => {
                  const c = krColor(kr.progress)
                  return (
                    <div key={kr.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm text-slate-600 truncate">{kr.description}</p>
                        <span className="text-sm font-bold ml-2 shrink-0 tabular-nums" style={{ color: c.text }}>
                          {kr.progress}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${kr.progress}%`, background: c.bar }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
