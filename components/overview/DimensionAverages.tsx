'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Stats } from '@/types'

interface Props {
  data: Stats['dimAverages']
}

const DIMENSIONS = [
  { key: 'timeAge', label: 'Time & Age', max: 20, color: '#F87171' },
  { key: 'complexity', label: 'Issue Complexity', max: 15, color: '#FBBF24' },
  { key: 'comms', label: 'Comm Signals', max: 15, color: '#FBBF24' },
  { key: 'business', label: 'Business Value', max: 20, color: '#818CF8' },
  { key: 'ownership', label: 'Ownership', max: 10, color: '#A78BFA' },
  { key: 'historical', label: 'Historical', max: 5, color: '#94A3B8' },
  { key: 'risk', label: 'Risk Signals', max: 15, color: '#34D399' },
]

export default function DimensionAverages({ data }: Props) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div style={{ background: '#161932', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', padding: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
      <div className="flex justify-between items-center mb-4">
        <span style={{ fontWeight: 500, fontSize: 12, color: '#8B85AA', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif' }}>
          Scoring dimension averages
        </span>
        <span style={{ fontSize: 11, color: '#6B65AA', fontFamily: 'Inter, sans-serif' }}>across all open</span>
      </div>

      {DIMENSIONS.map(dim => {
        const avg = data[dim.key as keyof typeof data] || 0
        const pct = (avg / dim.max) * 100

        return (
          <div
            key={dim.key}
            className="flex items-center gap-2 mb-2 cursor-pointer rounded px-1 transition-colors"
            onClick={() => router.push('/dashboard/detail')}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
          >
            <span style={{ fontWeight: 400, fontSize: 11, color: '#8B85AA', width: 96, flexShrink: 0, fontFamily: 'Inter, sans-serif' }}>
              {dim.label}
            </span>
            <div
              className="flex-1 rounded-full overflow-hidden"
              style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.08)' }}
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
            <span style={{ fontWeight: 500, fontSize: 11, color: '#E8E6F0', marginLeft: 4, fontFamily: 'Inter, sans-serif' }}>
              {avg.toFixed(1)}
            </span>
            <span style={{ fontWeight: 400, fontSize: 10, color: '#6B65AA', fontFamily: 'Inter, sans-serif' }}>
              /{dim.max}
            </span>
          </div>
        )
      })}
    </div>
  )
}
