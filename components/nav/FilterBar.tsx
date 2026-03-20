'use client'

import { useAppStore } from '@/lib/store'
import type { FilterState } from '@/types'

const FILTER_LABELS: Partial<Record<keyof FilterState, (v: unknown) => string>> = {
  priority: (v) => `Priority: ${v}`,
  status: (v) => `Status: ${v}`,
  channel: (v) => `Channel: ${v}`,
  tier: (v) => `Tier: ${v}`,
  owner: (v) => `Owner: ${v}`,
  scoreRange: (v) => `Score: ${(v as [number, number]).join('–')}`,
  search: (v) => `"${v}"`,
}

const FILTER_COLORS: Partial<Record<keyof FilterState, { text: string; bg: string; border: string }>> = {
  priority: { text: '#E53030', bg: '#FDEAEA', border: '#FCA5A5' },
  channel:  { text: '#7308E3', bg: '#EDE8FD', border: '#C4B5FD' },
  status:   { text: '#1A0A2B', bg: '#F6F3FF', border: '#D9D0F8' },
  tier:     { text: '#D97706', bg: '#FEF3C7', border: '#FCD34D' },
  owner:    { text: '#6B5E8B', bg: '#F6F3FF', border: '#D9D0F8' },
  scoreRange: { text: '#7308E3', bg: '#EDE8FD', border: '#C4B5FD' },
  search:   { text: '#1A0A2B', bg: '#F6F3FF', border: '#D9D0F8' },
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
      colors: FILTER_COLORS[key as keyof FilterState] || { text: '#6B5E8B', bg: '#F6F3FF', border: '#D9D0F8' },
    }))

  if (activeFilters.length === 0) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 20px',
        backgroundColor: '#F6F3FF',
        borderBottom: '1px solid #EDE8FD',
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontWeight: 500, fontSize: 11, color: '#9E94BC', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>
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
          color: '#7308E3',
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
