'use client'

import { useRouter } from 'next/navigation'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer,
} from 'recharts'
import { useAppStore } from '@/lib/store'
import type { Stats } from '@/types'

interface Props {
  data: Stats['rootCauseData']
}

const BAR_COLORS = ['#4F46E5', '#22D3EE', '#D946EF', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6']

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { cause: string; count: number; pct: number } }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{ background: '#080A1A', border: '1px solid #2D3561', borderRadius: 8, padding: '8px 12px' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#F1F5F9', marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>{d.cause}</div>
      <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>{d.count} escalations ({d.pct}%)</div>
    </div>
  )
}

export default function RootCauseChart({ data }: Props) {
  const router = useRouter()
  const { setFilter } = useAppStore()

  if (!data || data.length === 0) {
    return (
      <div style={{ background: '#1A1F3A', border: '1px solid #2D3561', borderRadius: 12, padding: 16 }}>
        <div style={{ textAlign: 'center', color: '#475569', fontSize: 12, padding: '20px 0', fontFamily: 'Inter, sans-serif' }}>
          No root cause data available
        </div>
      </div>
    )
  }

  const total = data.reduce((s, d) => s + d.count, 0)
  const chartData = data.map(d => ({ ...d, pct: total > 0 ? Math.round((d.count / total) * 100) : 0 }))

  const topCause = chartData[0]
  const fastest = [...data].sort((a, b) => a.avgResolutionHours - b.avgResolutionHours)[0]
  const slowest = [...data].sort((a, b) => b.avgResolutionHours - a.avgResolutionHours)[0]
  const mostB2b = [...data].sort((a, b) => b.b2bPct - a.b2bPct)[0]

  const handleFilter = (rootCause: string) => {
    setFilter('search', rootCause)
    router.push('/dashboard/detail')
  }

  const statRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '10px 0',
    borderBottom: '1px solid #2D3561',
    cursor: 'pointer',
  }

  return (
    <div className="card-lift" style={{ background: '#1A1F3A', border: '1px solid #2D3561', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontWeight: 500, fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif' }}>
          Root cause analysis
        </span>
        <span style={{ fontSize: 11, color: '#475569', fontFamily: 'Inter, sans-serif' }}>primary drivers of escalations</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 20 }}>
        {/* Left: Horizontal bar chart */}
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
            barSize={16}
          >
            <CartesianGrid horizontal={false} stroke="#2D3561" />
            <XAxis type="number" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="cause"
              width={120}
              tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Inter, sans-serif' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} animationDuration={800} cursor="pointer"
              onClick={(entry) => handleFilter((entry as { cause: string }).cause)}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Right: Summary stats */}
        <div style={{ paddingLeft: 8 }}>
          {[
            {
              label: 'Top root cause',
              value: topCause?.cause || '—',
              sub: topCause ? `${topCause.count} escalations (${topCause.pct}%)` : '',
              color: '#F1F5F9',
              data: topCause?.cause,
            },
            {
              label: 'Fastest to resolve',
              value: fastest?.cause || '—',
              sub: fastest ? `${fastest.avgResolutionHours}h avg` : '',
              color: '#10B981',
              data: fastest?.cause,
            },
            {
              label: 'Slowest to resolve',
              value: slowest?.cause || '—',
              sub: slowest ? `${slowest.avgResolutionHours}h avg` : '',
              color: '#EF4444',
              data: slowest?.cause,
            },
            {
              label: 'Most B2B-driven',
              value: mostB2b?.cause || '—',
              sub: mostB2b ? `${mostB2b.b2bPct}% B2B` : '',
              color: '#3B82F6',
              data: mostB2b?.cause,
            },
          ].map((row, i, arr) => (
            <div
              key={row.label}
              style={{ ...statRowStyle, borderBottom: i < arr.length - 1 ? '1px solid #2D3561' : 'none' }}
              onClick={() => row.data && handleFilter(row.data)}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = '#1E2952')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
            >
              <div>
                <div style={{ fontSize: 10, color: '#475569', fontFamily: 'Inter, sans-serif', marginBottom: 2 }}>{row.label}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: row.color, fontFamily: 'Inter, sans-serif' }}>{row.value}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'Inter, sans-serif', marginTop: 1 }}>{row.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
