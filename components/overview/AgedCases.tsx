'use client'

import { useRouter } from 'next/navigation'
import type { EscalationRow } from '@/types'

interface Props {
  cases: EscalationRow[]
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Blocked: { bg: '#FCEBEB', text: '#DC2626' },
  Open: { bg: '#FEF3C7', text: '#D97706' },
  'In Progress': { bg: '#EEF2FF', text: '#4F46E5' },
  Closed: { bg: '#D1FAE5', text: '#059669' },
}

export default function AgedCases({ cases }: Props) {
  const router = useRouter()

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', padding: 20 }}>
      <div className="flex justify-between items-center mb-3">
        <span style={{ fontWeight: 500, fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif' }}>
          Oldest open cases
        </span>
        <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>click to open record</span>
      </div>

      {cases.map((c, i) => {
        const ageDays = Math.round((c.age_hours || 0) / 24)
        const statusColors = STATUS_COLORS[c.current_status] || STATUS_COLORS.Open

        return (
          <div
            key={c.id}
            className="flex justify-between items-start cursor-pointer transition-colors py-2.5"
            style={{
              borderBottom: i < cases.length - 1 ? '1px solid #E5E7EB' : 'none',
            }}
            onClick={() => router.push(`/dashboard/detail?account=${encodeURIComponent(c.account_name)}`)}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
          >
            <div>
              <div style={{ fontWeight: 500, fontSize: 12, color: '#111827', fontFamily: 'Inter, sans-serif' }}>
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
                <span style={{ fontSize: 11, color: '#6B7280', marginLeft: 4, fontFamily: 'Inter, sans-serif' }}>
                  {c.channel} · {c.priority_hint || 'general'}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#DC2626', fontFamily: 'Inter, sans-serif' }}>
                {ageDays}d
              </div>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2, fontFamily: 'Inter, sans-serif' }}>
                SLA {c.sla_hours}h
              </div>
            </div>
          </div>
        )
      })}

      {cases.length === 0 && (
        <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 12, padding: '20px 0', fontFamily: 'Inter, sans-serif' }}>
          No aged cases found
        </div>
      )}
    </div>
  )
}
