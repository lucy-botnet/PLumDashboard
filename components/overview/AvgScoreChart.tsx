'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer
} from 'recharts'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import type { Stats } from '@/types'

interface Props {
  data: Stats['avgScoreBySegment']
}

const SEGMENTS = [
  { name: 'Enterprise', color: '#F87171', type: 'tier', filterKey: 'tier' as const },
  { name: 'Mid-Market', color: '#FBBF24', type: 'tier', filterKey: 'tier' as const },
  { name: 'SMB', color: '#94A3B8', type: 'tier', filterKey: 'tier' as const },
  { name: 'WhatsApp', color: '#34D399', type: 'channel', filterKey: 'channel' as const },
  { name: 'Slack', color: '#A78BFA', type: 'channel', filterKey: 'channel' as const },
  { name: 'Email', color: '#60A5FA', type: 'channel', filterKey: 'channel' as const },
]

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; avgScore: number; color: string } }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{ background: '#1E2340', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
      <div style={{ fontWeight: 500, fontSize: 12, color: '#E8E6F0' }}>{d.name}</div>
      <div style={{ fontSize: 11, color: '#8B85AA', marginTop: 2 }}>Avg score: {d.avgScore}</div>
    </div>
  )
}

export default function AvgScoreChart({ data }: Props) {
  const router = useRouter()
  const { setFilter, tier: activeTier, channel: activeChannel } = useAppStore()

  const chartData = SEGMENTS.map(s => ({
    name: s.name,
    avgScore: data[s.name as keyof typeof data] || 0,
    color: s.color,
    filterKey: s.filterKey,
  }))

  const handleClick = (entry: { name: string; filterKey: 'tier' | 'channel' }) => {
    const currentVal = entry.filterKey === 'tier' ? activeTier : activeChannel
    if (currentVal === entry.name) {
      setFilter(entry.filterKey, null)
    } else {
      setFilter(entry.filterKey, entry.name)
      router.push('/dashboard/detail')
    }
  }

  const isSelected = (name: string, filterKey: 'tier' | 'channel') => {
    if (filterKey === 'tier') return activeTier === name
    return activeChannel === name
  }

  const hasAnyFilter = !!activeTier || !!activeChannel

  return (
    <div className="card-lift" style={{ background: '#161932', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', padding: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
      <div className="flex justify-between items-center mb-3">
        <span style={{ fontWeight: 500, fontSize: 12, color: '#8B85AA', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif' }}>
          Avg score by tier & channel
        </span>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-3 flex-wrap">
        <div className="flex items-center gap-1 mr-2">
          <span style={{ fontSize: 10, color: '#6B65AA', fontFamily: 'Inter, sans-serif' }}>Tier:</span>
        </div>
        {SEGMENTS.filter(s => s.type === 'tier').map(s => (
          <div key={s.name} className="flex items-center gap-1">
            <div style={{ width: 8, height: 8, backgroundColor: s.color, borderRadius: 2 }} />
            <span style={{ fontSize: 10, color: '#8B85AA', fontFamily: 'Inter, sans-serif' }}>{s.name}</span>
          </div>
        ))}
        <div className="flex items-center gap-1 mr-2 ml-2">
          <span style={{ fontSize: 10, color: '#6B65AA', fontFamily: 'Inter, sans-serif' }}>Channel:</span>
        </div>
        {SEGMENTS.filter(s => s.type === 'channel').map(s => (
          <div key={s.name} className="flex items-center gap-1">
            <div style={{ width: 8, height: 8, backgroundColor: s.color, borderRadius: 2 }} />
            <span style={{ fontSize: 10, color: '#8B85AA', fontFamily: 'Inter, sans-serif' }}>{s.name}</span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B65AA' }} axisLine={false} tickLine={false} />
          <YAxis domain={[40, 80]} tick={{ fontSize: 10, fill: '#6B65AA' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="avgScore" radius={[6, 6, 0, 0]} barSize={28}
            onClick={(entry) => handleClick(entry as { name: string; filterKey: 'tier' | 'channel' })}>
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.color}
                opacity={hasAnyFilter && !isSelected(entry.name, entry.filterKey) ? 0.25 : 1}
                cursor="pointer"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
