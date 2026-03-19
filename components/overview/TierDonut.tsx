'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useAppStore } from '@/lib/store'
import type { Stats } from '@/types'

interface Props {
  data: Stats['byTier']
}

const TIERS = [
  { key: 'Enterprise', color: '#DC2626' },
  { key: 'Mid-Market', color: '#D97706' },
  { key: 'SMB', color: '#6B7280' },
]

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { total: number } }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  const pct = d.payload.total > 0 ? Math.round((d.value / d.payload.total) * 100) : 0
  return (
    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight: 500, fontSize: 12, color: '#111827' }}>{d.name}</div>
      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{d.value.toLocaleString()} · {pct}%</div>
    </div>
  )
}

export default function TierDonut({ data }: Props) {
  const { setFilter, tier: activeTier } = useAppStore()
  const total = (data.Enterprise || 0) + (data['Mid-Market'] || 0) + (data.SMB || 0)

  const chartData = TIERS.map(t => ({
    name: t.key,
    value: data[t.key as keyof typeof data] || 0,
    color: t.color,
    total,
  }))

  const handleClick = (entry: { name: string }) => {
    if (activeTier === entry.name) {
      setFilter('tier', null)
    } else {
      setFilter('tier', entry.name)
    }
  }

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', padding: 20 }}>
      <div className="mb-2">
        <span style={{ fontWeight: 500, fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif' }}>
          By tier
        </span>
      </div>

      <div className="relative" style={{ height: 140 }}>
        <ResponsiveContainer width="100%" height={140}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={65}
              paddingAngle={2}
              dataKey="value"
              onClick={handleClick}
              cursor="pointer"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.color}
                  opacity={activeTier && activeTier !== entry.name ? 0.3 : 1}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div style={{ fontWeight: 600, fontSize: 20, color: '#111827', fontFamily: 'Inter, sans-serif' }}>
            {total.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>total</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap mt-2">
        {chartData.map(item => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
          return (
            <div key={item.name} className="flex items-center gap-1">
              <div style={{ width: 8, height: 8, backgroundColor: item.color, borderRadius: 2 }} />
              <span style={{ fontSize: 11, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
                {item.name} · {item.value.toLocaleString()} · {pct}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
