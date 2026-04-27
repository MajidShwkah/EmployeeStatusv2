import Image from 'next/image'
import { Calendar, ChevronRight } from 'lucide-react'
import { getInitials, getAvatarBgClass } from '@/lib/utils'

export interface ObjectiveWithDetails {
  id: string
  title: string
  owners: Array<{ id: string; full_name: string | null; avatar_url: string | null }>
  custodians: Array<{ id: string; full_name: string | null; avatar_url: string | null }>
  keyResults: Array<{ id: string; description: string; progress: number }>
}

export interface OpcData {
  id: string
  cycleNumber: number
  startDate: string
  endDate: string
  objectives: ObjectiveWithDetails[]
}

interface Props {
  opc: OpcData
  objIdx: number
  krIdx: number
}

function Avatar({ name, url, size = 34 }: { name: string | null; url: string | null; size?: number }) {
  if (url) {
    return (
      <Image
        src={url}
        alt={name ?? ''}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size, boxShadow: '0 0 0 2px #fff' }}
      />
    )
  }
  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-bold ${getAvatarBgClass(name)}`}
      style={{ width: size, height: size, fontSize: size * 0.36, boxShadow: '0 0 0 2px #fff' }}
    >
      {getInitials(name)}
    </div>
  )
}

function daysLeft(endDate: string): number {
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86_400_000))
}

function krColor(pct: number): string {
  if (pct >= 80) return '#16a34a'
  if (pct >= 50) return '#2563eb'
  return '#f97316'
}

export default function OPCCarousel({ opc, objIdx, krIdx }: Props) {
  if (!opc.objectives.length) return null

  const obj  = opc.objectives[objIdx % opc.objectives.length]
  const kr   = obj?.keyResults[krIdx % Math.max(1, obj.keyResults.length)]
  const left = daysLeft(opc.endDate)

  const urgency =
    left <= 7  ? { color: '#b91c1c', bg: '#fef2f2',  border: '#fca5a5'  } :
    left <= 30 ? { color: '#92400e', bg: '#fffbeb',  border: '#fde68a'  } :
                 { color: '#166534', bg: '#f0fdf4',  border: '#86efac'  }

  return (
    <div
      className="w-full shrink-0"
      style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', boxShadow: '0 -2px 8px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-center px-8 py-5 gap-0" style={{ minHeight: '140px' }}>

        {/* OPC badge + dates */}
        <div className="shrink-0 flex flex-col gap-2.5 pr-8" style={{ minWidth: '240px' }}>
          <div
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full font-bold uppercase tracking-widest self-start"
            style={{ background: '#F97316', color: '#fff', fontSize: '1.1rem' }}
          >
            OPC #{opc.cycleNumber}
          </div>

          <div className="flex items-center gap-1.5 text-base font-medium" style={{ color: '#64748b' }}>
            <Calendar className="w-4 h-4 shrink-0" />
            <span>{opc.startDate}</span>
            <ChevronRight className="w-4 h-4 shrink-0" />
            <span>{opc.endDate}</span>
          </div>

          <div
            className="inline-flex items-center px-4 py-1 rounded-full text-base font-bold self-start"
            style={{ background: urgency.bg, color: urgency.color, border: `1.5px solid ${urgency.border}` }}
          >
            {left === 0 ? 'Ends today' : `${left} days left`}
          </div>
        </div>

        {/* Divider */}
        <div className="shrink-0 self-stretch my-2" style={{ width: 1, background: '#e2e8f0' }} />

        {/* Objective + KR */}
        <div className="flex-1 min-w-0 px-8">
          <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: '#94a3b8' }}>
            Objective {(objIdx % opc.objectives.length) + 1} of {opc.objectives.length}
          </p>
          <p className="font-bold leading-snug truncate" style={{ fontSize: '2rem', color: '#0f172a' }}>
            {obj.title}
          </p>

          {kr && (
            <div className="flex items-center gap-6 mt-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#94a3b8' }}>
                  Key Result Progress
                </p>
                <p className="text-2xl font-medium" style={{ color: '#334155' }}>
                  {kr.description}
                </p>
              </div>

              <div className="flex items-center gap-5 shrink-0">
                <div
                  className="rounded-full overflow-hidden"
                  style={{ width: 260, height: 18, background: '#e2e8f0' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${kr.progress}%`, background: krColor(kr.progress) }}
                  />
                </div>
                <span
                  className="font-black tabular-nums"
                  style={{ fontSize: '3rem', color: krColor(kr.progress), minWidth: '96px', textAlign: 'right', lineHeight: 1 }}
                >
                  {kr.progress}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="shrink-0 self-stretch my-2" style={{ width: 1, background: '#e2e8f0' }} />

        {/* People */}
        <div className="shrink-0 flex flex-col gap-4 pl-8" style={{ minWidth: '260px' }}>
          {obj.owners.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold uppercase tracking-wider shrink-0" style={{ color: '#94a3b8', minWidth: '76px' }}>
                Owner
              </span>
              <div className="flex items-center gap-2">
                {obj.owners.slice(0, 3).map((o) => <Avatar key={o.id} name={o.full_name} url={o.avatar_url} size={40} />)}
                <span className="text-slate-700 text-lg font-semibold ml-2 truncate max-w-[140px]">
                  {obj.owners[0].full_name}
                  {obj.owners.length > 1 ? ` +${obj.owners.length - 1}` : ''}
                </span>
              </div>
            </div>
          )}

          {obj.custodians.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold uppercase tracking-wider shrink-0" style={{ color: '#94a3b8', minWidth: '76px' }}>
                Custodian
              </span>
              <div className="flex items-center gap-2">
                {obj.custodians.slice(0, 3).map((c) => <Avatar key={c.id} name={c.full_name} url={c.avatar_url} size={40} />)}
                <span className="text-slate-700 text-lg font-semibold ml-2 truncate max-w-[140px]">
                  {obj.custodians[0].full_name}
                  {obj.custodians.length > 1 ? ` +${obj.custodians.length - 1}` : ''}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
