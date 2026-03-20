'use client'

import { useAppStore } from '@/lib/store'
import type { FilterState } from '@/types'

const FILTER_LABELS: Partial<Record<keyof FilterState, (v: unknown) => string>> = {
  priority: (v) => `Priority: ${v}`,
  status: (v) => `Status: ${v}`,
  channel: (v) => `Channel: ${v}`,
  tier: (v) => `Tier: ${v}`,
  owner: (v) => `Owner: ${v}`,
  b2bOrB2c: (v) => `Type: ${v}`,
  scoreRange: (v) => `Score: ${(v as [number, number]).join('–')}`,
  search: (v) => `"${v}"`,
}

const FILTER_COLORS: Partial<Record<keyof FilterState, { text: string; bg: string; border: string }>> = {
  priority:   { text: '#F87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
  channel:    { text: '#A78BFA', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
  status:     { text: '#C4C0D8', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.15)' },
  tier:       { text: '#FBBF24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' },
  owner:      { text: '#8B85AA', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)' },
  b2bOrB2c:  { text: '#34D399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)' },
  scoreRange: { text: '#A78BFA', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
  search:     { text: '#C4C0D8', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)' },
}

export default function FilterBar() {
  const store = useAppStore()

  const activeFilters = Object.entries(FILTER_LABELS)
    .filter(([key]) => {
      const val = store[key as keyof FilterState]
      return val !== null && val !== undefined && val !== ''
    })
    .map(([key, labelFn]) => ({
      key: key as keyof FilterState,
      label: labelFn!(store[key as keyof FilterState]),
      colors: FILTER_COLORS[key as keyof FilterState] || { text: '#8B85AA', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)' },
    }))

  if (activeFilters.length === 0) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 20px',
        backgroundColor: 'rgba(167,139,250,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontWeight: 500, fontSize: 11, color: '#6B65AA', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>
        FILTERED BY
      </span>

      {activeFilters.map(({ key, label, colors }) => (
        <div
          key={key}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: 20,
            padding: '3px 10px 3px 10px',
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 11, color: colors.text, fontFamily: 'Inter, sans-serif' }}>
            {label}
          </span>
          <button
            onClick={() => store.clearFilter(key)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: colors.text,
              fontSize: 14,
              lineHeight: 1,
              padding: '0 0 0 4px',
              opacity: 0.6,
              transition: 'opacity 120ms',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '0.6')}
          >
            ×
          </button>
        </div>
      ))}

      <div style={{ flex: 1 }} />

      <button
        onClick={() => store.clearAllFilters()}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 11,
          color: '#A78BFA',
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '0.02em',
          padding: '0',
          transition: 'opacity 120ms',
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.7')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
      >
        Clear all ×
      </button>
    </div>
  )
}
