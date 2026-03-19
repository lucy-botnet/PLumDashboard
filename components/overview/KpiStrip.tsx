'use client'

import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import type { Stats } from '@/types'

interface Props {
  stats: Stats
}

interface KpiCellProps {
  value: string | number
  label: string
  trend: string
  color: string
  barPct: number
  onClick: () => void
}

function KpiCell({ value, label, trend, color, barPct, onClick }: KpiCellProps) {
  return (
    <div
      className="px-6 flex flex-col justify-center cursor-pointer relative overflow-hidden transition-colors"
      style={{ height: 80 }}
      onClick={onClick}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'white')}
    >
      <div style={{ fontWeight: 600, fontSize: 36, color, fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontWeight: 400, fontSize: 12, color: '#6B7280', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>
        {label}
      </div>
      <div style={{ fontWeight: 400, fontSize: 11, color, fontFamily: 'Inter, sans-serif', marginTop: 1 }}>
        {trend}
      </div>
      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: 3, backgroundColor: '#F3F4F6' }}>
        <div
          style={{
            height: '100%',
            width: `${Math.min(barPct, 100)}%`,
            backgroundColor: color,
            transition: 'width 600ms ease-out',
          }}
        />
      </div>
    </div>
  )
}

export default function KpiStrip({ stats }: Props) {
  const router = useRouter()
  const { setFilter } = useAppStore()

  const slaBrechPct = stats.totalOpen > 0 ? Math.round((stats.slaBreach / stats.totalOpen) * 100) : 0
  const highPct = stats.totalOpen > 0 ? Math.round((stats.high / stats.totalOpen) * 100) : 0
  const blockedPct = stats.totalOpen > 0 ? Math.round((stats.blocked / stats.totalOpen) * 100) : 0

  const goToDetail = (priority?: string, status?: string) => {
    if (priority) setFilter('priority', priority)
    if (status) setFilter('status', status)
    router.push('/dashboard/detail')
  }

  return (
    <div
      className="w-full bg-white border-b grid grid-cols-4"
      style={{ borderBottomColor: '#E5E7EB' }}
    >
      {/* Dividers */}
      <div style={{ borderRight: '1px solid #E5E7EB' }}>
        <KpiCell
          value={stats.totalOpen.toLocaleString()}
          label="Total open"
          trend={`${stats.high + stats.medium + stats.low} active escalations`}
          color="#4F46E5"
          barPct={100}
          onClick={() => goToDetail()}
        />
      </div>
      <div style={{ borderRight: '1px solid #E5E7EB' }}>
        <KpiCell
          value={stats.high.toLocaleString()}
          label="High priority"
          trend={`${highPct}% of total`}
          color="#DC2626"
          barPct={highPct}
          onClick={() => goToDetail('High')}
        />
      </div>
      <div style={{ borderRight: '1px solid #E5E7EB' }}>
        <KpiCell
          value={stats.blocked.toLocaleString()}
          label="Blocked"
          trend={`${blockedPct}% of open`}
          color="#D97706"
          barPct={blockedPct}
          onClick={() => goToDetail(undefined, 'Blocked')}
        />
      </div>
      <div>
        <KpiCell
          value={`${slaBrechPct}%`}
          label="SLA breach rate"
          trend={`${stats.slaBreach} of ${stats.totalOpen}`}
          color="#DC2626"
          barPct={slaBrechPct}
          onClick={() => goToDetail()}
        />
      </div>
    </div>
  )
}
