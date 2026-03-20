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
        background: 'transparent',
      }}
      onClick={onClick}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
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
      <div style={{ fontWeight: 500, fontSize: 12, color: '#E8E6F0', fontFamily: 'Inter, sans-serif', marginTop: 4 }}>
        {label}
      </div>
      <div style={{ fontWeight: 400, fontSize: 11, color: '#6B65AA', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>
        {sub}
      </div>

      {/* Bottom progress bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.06)' }}>
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
      accent: '#A78BFA',
      accentBg: 'rgba(167,139,250,0.15)',
      barPct: 100,
      icon: '📋',
      onClick: () => goToDetail(),
    },
    {
      value: stats.high.toLocaleString(),
      label: 'High priority',
      sub: `${highPct}% of total`,
      accent: '#F87171',
      accentBg: 'rgba(248,113,113,0.15)',
      barPct: highPct,
      icon: '🔴',
      onClick: () => goToDetail('High'),
    },
    {
      value: stats.blocked.toLocaleString(),
      label: 'Blocked',
      sub: `${blockedPct}% of open`,
      accent: '#FBBF24',
      accentBg: 'rgba(251,191,36,0.15)',
      barPct: blockedPct,
      icon: '⛔',
      onClick: () => goToDetail(undefined, 'Blocked'),
    },
    {
      value: `${slaBrechPct}%`,
      label: 'SLA breach rate',
      sub: `${stats.slaBreach} of ${stats.totalOpen}`,
      accent: slaBrechPct > 50 ? '#F87171' : '#FBBF24',
      accentBg: slaBrechPct > 50 ? 'rgba(248,113,113,0.15)' : 'rgba(251,191,36,0.15)',
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
        backgroundColor: '#161932',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}
    >
      {cells.map((cell, i) => (
        <div
          key={cell.label}
          style={{ borderRight: i < cells.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}
        >
          <KpiCell {...cell} />
        </div>
      ))}
    </div>
  )
}
