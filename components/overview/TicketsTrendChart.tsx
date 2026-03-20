'use client'

import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Label,
} from 'recharts'
import type { Stats } from '@/types'

interface Props {
  data: Stats['ticketsTrend']
}

const RANGES = ['3M', '6M', '1Y', 'All'] as const
type Range = typeof RANGES[number]

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#080A1A', border: '1px solid #2D3561', borderRadius: 8, padding: '8px 12px' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#F1F5F9', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ fontSize: 11, color: p.color, fontFamily: 'Inter, sans-serif', marginBottom: 2 }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  )
}

export default function TicketsTrendChart({ data }: Props) {
  const [range, setRange] = useState<Range>('6M')

  const getFilteredData = () => {
    if (range === 'All') return data
    const months = range === '3M' ? 3 : range === '6M' ? 6 : 12
    return data.slice(-months)
  }

  const filtered = getFilteredData()

  // Find max resolved point
  const maxResolved = filtered.reduce((max, d) => d.resolved > max.resolved ? d : max, filtered[0] || { period: '', resolved: 0 })

  return (
    <div className="card-lift" style={{ background: '#1A1F3A', border: '1px solid #2D3561', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}>
            Escalations raised vs resolved
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 2, backgroundColor: '#22D3EE', borderRadius: 1 }} />
              <span style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>Resolved</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 2, background: 'repeating-linear-gradient(90deg, #D946EF 0 6px, transparent 6px 9px)', borderRadius: 1 }} />
              <span style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>Raised</span>
            </div>
          </div>
          {/* Range pills */}
          <div style={{ display: 'flex', gap: 4 }}>
            {RANGES.map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                style={{
                  fontSize: 11,
                  fontFamily: 'Inter, sans-serif',
                  padding: '3px 10px',
                  borderRadius: 20,
                  border: range === r ? 'none' : '1px solid #2D3561',
                  backgroundColor: range === r ? '#4F46E5' : 'transparent',
                  color: range === r ? 'white' : '#94A3B8',
                  cursor: 'pointer',
                  fontWeight: range === r ? 600 : 400,
                  transition: 'all 150ms',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={filtered} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E2952" />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 11, fill: '#475569', fontFamily: 'Inter, sans-serif' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#475569', fontFamily: 'Inter, sans-serif' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {maxResolved && maxResolved.resolved > 0 && (
            <ReferenceLine
              x={maxResolved.period}
              stroke="#D946EF"
              strokeDasharray="4 2"
              label={
                <Label
                  value={`Max = ${maxResolved.resolved}`}
                  position="top"
                  style={{ fontSize: 10, fill: '#D946EF', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                />
              }
            />
          )}
          <Line
            name="Resolved"
            type="monotone"
            dataKey="resolved"
            stroke="#22D3EE"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: '#22D3EE', stroke: '#080A1A', strokeWidth: 2 }}
          />
          <Line
            name="Raised"
            type="monotone"
            dataKey="raised"
            stroke="#D946EF"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
            activeDot={{ r: 6, fill: '#D946EF' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
