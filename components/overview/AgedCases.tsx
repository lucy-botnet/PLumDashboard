'use client'

import { useRouter } from 'next/navigation'
import type { EscalationRow } from '@/types'

interface Props {
  cases: EscalationRow[]
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Blocked: { bg: 'rgba(248,113,113,0.15)', text: '#F87171' },
  Open: { bg: 'rgba(251,191,36,0.15)', text: '#FBBF24' },
  'In Progress': { bg: 'rgba(99,102,241,0.15)', text: '#818CF8' },
  Closed: { bg: 'rgba(52,211,153,0.15)', text: '#34D399' },
}

export default function AgedCases({ cases }: Props) {
  const router = useRouter()

  return (
    <div className="card-lift" style={{ background: '#161932', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', padding: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
      <div className="flex justify-between items-center mb-3">
        <span style={{ fontWeight: 500, fontSize: 12, color: '#8B85AA', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif' }}>
          Oldest open cases
        </span>
        <span style={{ fontSize: 11, color: '#6B65AA', fontFamily: 'Inter, sans-serif' }}>click to open record</span>
      </div>

      {cases.map((c, i) => {
        const ageDays = Math.round((c.age_hours || 0) / 24)
        const statusColors = STATUS_COLORS[c.current_status] || STATUS_COLORS.Open

        return (
          <div
            key={c.id}
            className="flex justify-between items-start cursor-pointer transition-colors py-2.5"
            style={{
              borderBottom: i < cases.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}
            onClick={() => router.push(`/dashboard/detail?account=${encodeURIComponent(c.account_name)}`)}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
          >
            <div>
              <div style={{ fontWeight: 500, fontSize: 12, color: '#E8E6F0', fontFamily: 'Inter, sans-serif' }}>
                {c.account_name}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span
                  style={{
                    fontSize: 10,
                    backgroundColor: statusColors.bg,
                    color: statusColors.text,
                    borderRadius: 20,
                    padding: '1px 6px',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {c.current_status}
                </span>
                <span style={{ fontSize: 11, color: '#6B65AA', marginLeft: 4, fontFamily: 'Inter, sans-serif' }}>
                  {c.channel} · {c.priority_hint || 'general'}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#F87171', fontFamily: 'Inter, sans-serif' }}>
                {ageDays}d
              </div>
              <div style={{ fontSize: 10, color: '#6B65AA', marginTop: 2, fontFamily: 'Inter, sans-serif' }}>
                SLA {c.sla_hours}h
              </div>
            </div>
          </div>
        )
      })}

      {cases.length === 0 && (
        <div style={{ textAlign: 'center', color: '#6B65AA', fontSize: 12, padding: '20px 0', fontFamily: 'Inter, sans-serif' }}>
          No aged cases found
        </div>
      )}
    </div>
  )
}
