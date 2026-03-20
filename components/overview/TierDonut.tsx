'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import type { Stats } from '@/types'

interface Props {
  data: Stats['byTier']
}

const TIERS = [
  { key: 'Enterprise', color: '#F87171' },
  { key: 'Mid-Market', color: '#FBBF24' },
  { key: 'SMB', color: '#94A3B8' },
]

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { total: number } }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  const pct = d.payload.total > 0 ? Math.round((d.value / d.payload.total) * 100) : 0
  return (
    <div style={{ background: '#1E2340', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
      <div style={{ fontWeight: 500, fontSize: 12, color: '#E8E6F0' }}>{d.name}</div>
      <div style={{ fontSize: 11, color: '#8B85AA', marginTop: 2 }}>{d.value.toLocaleString()} · {pct}%</div>
    </div>
  )
}

export default function TierDonut({ data }: Props) {
  const { setFilter, tier: activeTier } = useAppStore()
  const router = useRouter()
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
      router.push('/dashboard/detail')
    }
  }

  return (
    <div className="card-lift" style={{ background: '#161932', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', padding: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
      <div className="mb-2">
        <span style={{ fontWeight: 500, fontSize: 12, color: '#8B85AA', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif' }}>
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
                  opacity={activeTier && activeTier !== entry.name ? 0.25 : 1}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div style={{ fontWeight: 600, fontSize: 20, color: '#E8E6F0', fontFamily: 'Inter, sans-serif' }}>
            {total.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: '#6B65AA', fontFamily: 'Inter, sans-serif' }}>total</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap mt-2">
        {chartData.map(item => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
          return (
            <div key={item.name} className="flex items-center gap-1">
              <div style={{ width: 8, height: 8, backgroundColor: item.color, borderRadius: 2 }} />
              <span style={{ fontSize: 11, color: '#8B85AA', fontFamily: 'Inter, sans-serif' }}>
                {item.name} · {item.value.toLocaleString()} · {pct}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
