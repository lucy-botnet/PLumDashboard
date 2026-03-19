'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Stats } from '@/types'

interface Props {
  data: Stats['dimAverages']
}

const DIMENSIONS = [
  { key: 'timeAge', label: 'Time & Age', max: 20, color: '#DC2626' },
  { key: 'complexity', label: 'Issue Complexity', max: 15, color: '#D97706' },
  { key: 'comms', label: 'Comm Signals', max: 15, color: '#D97706' },
  { key: 'business', label: 'Business Value', max: 20, color: '#4F46E5' },
  { key: 'ownership', label: 'Ownership', max: 10, color: '#7C3AED' },
  { key: 'historical', label: 'Historical', max: 5, color: '#6B7280' },
  { key: 'risk', label: 'Risk Signals', max: 15, color: '#059669' },
]

export default function DimensionAverages({ data }: Props) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', padding: 20 }}>
      <div className="flex justify-between items-center mb-4">
        <span style={{ fontWeight: 500, fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif' }}>
          Scoring dimension averages
        </span>
        <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>across all open</span>
      </div>

      {DIMENSIONS.map(dim => {
        const avg = data[dim.key as keyof typeof data] || 0
        const pct = (avg / dim.max) * 100

        return (
          <div
            key={dim.key}
            className="flex items-center gap-2 mb-2 cursor-pointer rounded px-1 transition-colors"
            onClick={() => router.push('/dashboard/detail')}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
          >
            <span style={{ fontWeight: 400, fontSize: 11, color: '#6B7280', width: 96, flexShrink: 0, fontFamily: 'Inter, sans-serif' }}>
              {dim.label}
            </span>
            <div
              className="flex-1 rounded-full overflow-hidden"
              style={{ height: 4, backgroundColor: '#F3F4F6' }}
            >
              <div
                style={{
                  height: '100%',
                  width: mounted ? `${pct}%` : '0%',
                  backgroundColor: dim.color,
                  borderRadius: 999,
                  transition: 'width 600ms ease-out',
                }}
              />
            </div>
            <span style={{ fontWeight: 500, fontSize: 11, color: '#111827', marginLeft: 4, fontFamily: 'Inter, sans-serif' }}>
              {avg.toFixed(1)}
            </span>
            <span style={{ fontWeight: 400, fontSize: 10, color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>
              /{dim.max}
            </span>
          </div>
        )
      })}
    </div>
  )
}
