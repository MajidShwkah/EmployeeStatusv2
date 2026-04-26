'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import {
  createKeyResult,
  updateObjective,
  deleteObjective,
  setObjectiveOwners,
  setObjectiveCustodians,
} from '@/app/coordinator/actions'
import KeyResultSlider from './KeyResultSlider'

interface UserOption {
  id: string
  full_name: string | null
}

interface KR {
  id: string
  description: string
  progress: number
}

interface Props {
  id: string
  title: string
  owners: string[]
  custodians: string[]
  keyResults: KR[]
  allUsers: UserOption[]
}

export default function ObjectiveForm({ id, title: initialTitle, owners: initialOwners, custodians: initialCustodians, keyResults, allUsers }: Props) {
  const [title, setTitle] = useState(initialTitle)
  const [editingTitle, setEditingTitle] = useState(false)
  const [selectedOwners, setSelectedOwners] = useState<string[]>(initialOwners)
  const [selectedCustodians, setSelectedCustodians] = useState<string[]>(initialCustodians)
  const [expanded, setExpanded] = useState(false)
  const [newKrDesc, setNewKrDesc] = useState('')
  const [addingKr, setAddingKr] = useState(false)
  const [saving, setSaving] = useState(false)

  const saveTitle = async () => {
    setSaving(true)
    await updateObjective(id, title)
    setSaving(false)
    setEditingTitle(false)
  }

  const saveOwners = async (ids: string[]) => {
    setSelectedOwners(ids)
    await setObjectiveOwners(id, ids)
  }

  const saveCustodians = async (ids: string[]) => {
    setSelectedCustodians(ids)
    await setObjectiveCustodians(id, ids)
  }

  const addKr = async () => {
    if (!newKrDesc.trim()) return
    setAddingKr(true)
    await createKeyResult(id, newKrDesc)
    setNewKrDesc('')
    setAddingKr(false)
  }

  const remove = async () => {
    if (!confirm('Delete this objective and all its key results?')) return
    await deleteObjective(id)
  }

  const toggleUser = (userId: string, list: string[], setList: (v: string[]) => void, saveFunc: (ids: string[]) => void) => {
    const next = list.includes(userId) ? list.filter((id) => id !== userId) : [...list, userId]
    saveFunc(next)
    setList(next)
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {editingTitle ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={300}
              className="flex-1 px-3 py-1 rounded-lg border border-blue-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              autoFocus
            />
            <button onClick={() => setEditingTitle(false)} className="text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>
            <button
              onClick={saveTitle}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium cursor-pointer disabled:opacity-60"
            >
              <Check className="w-3.5 h-3.5" />
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-2">
            <p className="font-medium text-slate-900 truncate">{title}</p>
            <button
              onClick={() => setEditingTitle(true)}
              className="text-slate-400 hover:text-blue-600 cursor-pointer shrink-0"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <span className="text-xs text-slate-400">{keyResults.length} KRs</span>

        <button
          onClick={remove}
          className="text-slate-400 hover:text-red-500 cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="p-4 flex flex-col gap-4">
          {/* People */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Owners</p>
              <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                {allUsers.map((u) => (
                  <label key={u.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedOwners.includes(u.id)}
                      onChange={() => toggleUser(u.id, selectedOwners, setSelectedOwners, saveOwners)}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-slate-700">{u.full_name ?? u.id.slice(0, 8)}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Custodians</p>
              <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                {allUsers.map((u) => (
                  <label key={u.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCustodians.includes(u.id)}
                      onChange={() => toggleUser(u.id, selectedCustodians, setSelectedCustodians, saveCustodians)}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-slate-700">{u.full_name ?? u.id.slice(0, 8)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Key Results */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Key Results</p>
            <div className="flex flex-col gap-2">
              {keyResults.map((kr) => (
                <KeyResultSlider key={kr.id} {...kr} />
              ))}

              {/* Add KR */}
              <div className="flex gap-2 mt-1">
                <input
                  value={newKrDesc}
                  onChange={(e) => setNewKrDesc(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addKr() }}
                  placeholder="Add key result…"
                  maxLength={500}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400"
                />
                <button
                  onClick={addKr}
                  disabled={addingKr || !newKrDesc.trim()}
                  className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  {addingKr ? '…' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
