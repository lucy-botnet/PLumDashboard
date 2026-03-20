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
  sub: string
  accent: string
  accentBg: string
  barPct: number
  icon: string
  onClick: () => void
}

function KpiCell({ value, label, sub, accent, accentBg, barPct, icon, onClick }: KpiCellProps) {
  return (
    <div
      style={{
        padding: '18px 20px 14px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background 150ms',
        background: 'white',
      }}
      onClick={onClick}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#FDFCFF')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'white')}
    >
      {/* Icon badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: 8,
          backgroundColor: accentBg,
          fontSize: 14,
          marginBottom: 10,
        }}
      >
        {icon}
      </div>

      <div style={{ fontWeight: 700, fontSize: 32, color: accent, fontFamily: 'Inter, sans-serif', lineHeight: 1, letterSpacing: '-1px' }}>
        {value}
      </div>
      <div style={{ fontWeight: 500, fontSize: 12, color: '#1A0A2B', fontFamily: 'Inter, sans-serif', marginTop: 4 }}>
        {label}
      </div>
      <div style={{ fontWeight: 400, fontSize: 11, color: '#9E94BC', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>
        {sub}
      </div>

      {/* Bottom progress bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: '#F6F3FF' }}>
        <div
          style={{
            height: '100%',
            width: `${Math.min(barPct, 100)}%`,
            background: `linear-gradient(90deg, ${accent}, ${accent}CC)`,
            transition: 'width 700ms ease-out',
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

  const cells = [
    {
      value: stats.totalOpen.toLocaleString(),
      label: 'Total open',
      sub: `${stats.high + stats.medium + stats.low} active`,
      accent: '#7308E3',
      accentBg: '#EDE8FD',
      barPct: 100,
      icon: '📋',
      onClick: () => goToDetail(),
    },
    {
      value: stats.high.toLocaleString(),
      label: 'High priority',
      sub: `${highPct}% of total`,
      accent: '#E53030',
      accentBg: '#FDEAEA',
      barPct: highPct,
      icon: '🔴',
      onClick: () => goToDetail('High'),
    },
    {
      value: stats.blocked.toLocaleString(),
      label: 'Blocked',
      sub: `${blockedPct}% of open`,
      accent: '#D97706',
      accentBg: '#FEF3C7',
      barPct: blockedPct,
      icon: '⛔',
      onClick: () => goToDetail(undefined, 'Blocked'),
    },
    {
      value: `${slaBrechPct}%`,
      label: 'SLA breach rate',
      sub: `${stats.slaBreach} of ${stats.totalOpen}`,
      accent: slaBrechPct > 50 ? '#E53030' : '#D97706',
      accentBg: slaBrechPct > 50 ? '#FDEAEA' : '#FEF3C7',
      barPct: slaBrechPct,
      icon: '⏱',
      onClick: () => goToDetail(),
    },
  ]

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        backgroundColor: 'white',
        border: '1px solid #EDE8FD',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(115,8,227,0.06)',
      }}
    >
      {cells.map((cell, i) => (
        <div
          key={cell.label}
          style={{ borderRight: i < cells.length - 1 ? '1px solid #EDE8FD' : 'none' }}
        >
          <KpiCell {...cell} />
        </div>
      ))}
    </div>
  )
}
