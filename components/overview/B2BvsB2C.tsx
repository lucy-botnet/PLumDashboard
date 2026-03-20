'use client'

import { useRouter } from 'next/navigation'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer,
} from 'recharts'
import { useAppStore } from '@/lib/store'
import type { Stats } from '@/types'

interface Props {
  data: Stats['b2bVsB2c']
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: { priority: string; b2b: number; b2c: number } }>; label?: string }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const total = d.b2b + d.b2c
  return (
    <div style={{ background: '#080A1A', border: '1px solid #2D3561', borderRadius: 8, padding: '8px 12px' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#F1F5F9', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>{label}</div>
      <div style={{ fontSize: 11, color: '#3B82F6', fontFamily: 'Inter, sans-serif', marginBottom: 2 }}>B2B: <strong>{d.b2b}</strong></div>
      <div style={{ fontSize: 11, color: '#D946EF', fontFamily: 'Inter, sans-serif', marginBottom: 2 }}>B2C: <strong>{d.b2c}</strong></div>
      <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>Total: <strong>{total}</strong></div>
    </div>
  )
}

export default function B2BvsB2C({ data }: Props) {
  const router = useRouter()
  const { setFilter } = useAppStore()
  const { b2bCount, b2cCount, byPriority } = data
  const total = b2bCount + b2cCount
  const b2bPct = total > 0 ? Math.round((b2bCount / total) * 100) : 0
  const b2cPct = total > 0 ? Math.round((b2cCount / total) * 100) : 0

  // High priority B2B share
  const highPriorityRow = byPriority.find(r => r.priority === 'High')
  const highTotal = highPriorityRow ? highPriorityRow.b2b + highPriorityRow.b2c : 0
  const highB2bPct = highTotal > 0 ? Math.round((highPriorityRow!.b2b / highTotal) * 100) : 0

  const handleBarClick = (entry: { priority: string }, type: 'B2B' | 'B2C') => {
    setFilter('priority', entry.priority)
    setFilter('b2bOrB2c', type)
    router.push('/dashboard/detail')
  }

  return (
    <div className="card-lift" style={{ background: '#1A1F3A', border: '1px solid #2D3561', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 500, fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif' }}>
          B2B vs B2C distribution
        </span>
        <span style={{ fontSize: 11, color: '#475569', fontFamily: 'Inter, sans-serif' }}>by escalation count</span>
      </div>

      {/* Pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <span style={{
          background: '#1E3A5F', border: '1px solid #3B82F6', borderRadius: 20,
          padding: '4px 12px', fontSize: 11, fontWeight: 500, color: '#3B82F6', fontFamily: 'Inter, sans-serif',
        }}>
          B2B {b2bCount} · {b2bPct}%
        </span>
        <span style={{
          background: '#2D1B4E', border: '1px solid #D946EF', borderRadius: 20,
          padding: '4px 12px', fontSize: 11, fontWeight: 500, color: '#D946EF', fontFamily: 'Inter, sans-serif',
        }}>
          B2C {b2cCount} · {b2cPct}%
        </span>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={byPriority} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E2952" />
          <XAxis dataKey="priority" tick={{ fontSize: 11, fill: '#475569', fontFamily: 'Inter, sans-serif' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#475569', fontFamily: 'Inter, sans-serif' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="b2b" name="B2B" stackId="a" radius={[0, 0, 0, 0]} cursor="pointer"
            onClick={(entry) => handleBarClick(entry as { priority: string }, 'B2B')}>
            {byPriority.map((entry, i) => (
              <Cell key={i}
                fill={entry.priority === 'High' ? '#1D4ED8' : entry.priority === 'Medium' ? '#3B82F6' : '#93C5FD'}
              />
            ))}
          </Bar>
          <Bar dataKey="b2c" name="B2C" stackId="a" radius={[4, 4, 0, 0]} cursor="pointer"
            onClick={(entry) => handleBarClick(entry as { priority: string }, 'B2C')}>
            {byPriority.map((entry, i) => (
              <Cell key={i}
                fill={entry.priority === 'High' ? '#A21CAF' : entry.priority === 'Medium' ? '#D946EF' : '#F0ABFC'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8', fontFamily: 'Inter, sans-serif', marginTop: 8 }}>
        B2B accounts generate <strong style={{ color: '#3B82F6' }}>{highB2bPct}%</strong> of High priority escalations
      </div>
    </div>
  )
}
