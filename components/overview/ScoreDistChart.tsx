'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer
} from 'recharts'
import { useAppStore } from '@/lib/store'
import type { Stats } from '@/types'

interface Props {
  data: Stats['scoreDistribution']
}

const BRACKETS = [
  { range: '0–30', key: '0-30', color: '#059669', min: 0, max: 30 },
  { range: '31–45', key: '31-45', color: '#059669', min: 31, max: 45 },
  { range: '46–60', key: '46-60', color: '#D97706', min: 46, max: 60 },
  { range: '61–70', key: '61-70', color: '#D97706', min: 61, max: 70 },
  { range: '71–85', key: '71-85', color: '#DC2626', min: 71, max: 85 },
  { range: '86–100', key: '86-100', color: '#DC2626', min: 86, max: 100 },
]

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { range: string; count: number; total: number } }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const pct = d.total > 0 ? Math.round((d.count / d.total) * 100) : 0
  return (
    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight: 500, fontSize: 12, color: '#111827' }}>Score {d.range}</div>
      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{d.count.toLocaleString()} escalations · {pct}%</div>
    </div>
  )
}

export default function ScoreDistChart({ data }: Props) {
  const { setFilter, scoreRange } = useAppStore()
  const total = Object.values(data).reduce((a, b) => a + b, 0)

  const chartData = BRACKETS.map(b => ({
    range: b.range,
    count: data[b.key as keyof typeof data] || 0,
    color: b.color,
    min: b.min,
    max: b.max,
    total,
  }))

  const low = (data['0-30'] || 0) + (data['31-45'] || 0)
  const medium = (data['46-60'] || 0) + (data['61-70'] || 0)
  const high = (data['71-85'] || 0) + (data['86-100'] || 0)

  const handleBarClick = (entry: { min: number; max: number }) => {
    if (scoreRange && scoreRange[0] === entry.min && scoreRange[1] === entry.max) {
      setFilter('scoreRange', null)
    } else {
      setFilter('scoreRange', [entry.min, entry.max])
    }
  }

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', padding: 20 }}>
      <div className="flex justify-between items-center mb-3">
        <span style={{ fontWeight: 500, fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif' }}>
          Score distribution
        </span>
        <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>Open escalations</span>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-3">
        {[
          { color: '#059669', label: 'Low <45', count: low },
          { color: '#D97706', label: 'Medium 45–69', count: medium },
          { color: '#DC2626', label: 'High 70–100', count: high },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div style={{ width: 8, height: 8, backgroundColor: item.color, borderRadius: 2 }} />
            <span style={{ fontSize: 11, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
              {item.label} · {item.count.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} tickCount={4} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={600} animationEasing="ease-out"
            onClick={(entry) => handleBarClick(entry as { min: number; max: number })}>
            {chartData.map((entry, index) => {
              const isSelected = scoreRange && scoreRange[0] === entry.min && scoreRange[1] === entry.max
              const hasSelection = scoreRange !== null
              return (
                <Cell
                  key={index}
                  fill={entry.color}
                  opacity={hasSelection && !isSelected ? 0.3 : 1}
                  cursor="pointer"
                />
              )
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
