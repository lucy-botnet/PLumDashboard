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

const FILTER_COLORS: Partial<Record<keyof FilterState, string>> = {
  priority: '#DC2626',
  channel: '#4F46E5',
  status: '#0C447C',
  tier: '#633806',
  owner: '#6B7280',
  scoreRange: '#7C3AED',
  search: '#111827',
}

export default function FilterBar() {
  const store = useAppStore()

  const activeFilters = Object.entries(FILTER_LABELS)
    .filter(([key]) => {
      const val = store[key as keyof FilterState]
      if (val === null || val === undefined || val === '') return false
      return true
    })
    .map(([key, labelFn]) => ({
      key: key as keyof FilterState,
      label: labelFn!(store[key as keyof FilterState]),
      color: FILTER_COLORS[key as keyof FilterState] || '#6B7280',
    }))

  if (activeFilters.length === 0) return null

  return (
    <div
      className="w-full flex items-center gap-3 px-6 border-b"
      style={{
        height: 44,
        backgroundColor: '#F3F4F6',
        borderBottomColor: '#E5E7EB',
      }}
    >
      <span style={{ fontWeight: 400, fontSize: 12, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
        Filtered by:
      </span>

      {activeFilters.map(({ key, label, color }) => (
        <div
          key={key}
          className="flex items-center gap-1"
          style={{
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: 20,
            padding: '2px 10px',
          }}
        >
          <span style={{ fontWeight: 500, fontSize: 12, color, fontFamily: 'Inter, sans-serif' }}>
            {label}
          </span>
          <button
            onClick={() => store.clearFilter(key)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9CA3AF',
              fontSize: 14,
              lineHeight: 1,
              padding: '0 0 0 4px',
            }}
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
          fontWeight: 400,
          fontSize: 12,
          color: '#4F46E5',
          fontFamily: 'Inter, sans-serif',
          textDecoration: 'none',
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.textDecoration = 'underline')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.textDecoration = 'none')}
      >
        Clear all
      </button>
    </div>
  )
}
