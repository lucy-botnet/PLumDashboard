'use client'

import type { EscalationRow } from '@/types'

interface Props {
  cases: EscalationRow[]
}

function getBarColor(pct: number): string {
  if (pct < 50) return '#10B981'
  if (pct < 80) return '#F59E0B'
  return '#EF4444'
}

function TimelineRow({ esc, isLast }: { esc: EscalationRow; isLast: boolean }) {
  const ageHours = esc.age_hours || 0
  const maxHours = esc.max_resolution_hours || 48
  const rawPct = Math.min((ageHours / maxHours) * 100, 100)
  const barColor = getBarColor(rawPct)
  const isOverdue = ageHours > maxHours

  return (
    <div style={{ paddingBottom: isLast ? 0 : 10, marginBottom: isLast ? 0 : 10, borderBottom: isLast ? 'none' : '1px solid #2D3561' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12, fontWeight: 500, color: '#F1F5F9', fontFamily: 'Inter, sans-serif',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {esc.account_name}
          </div>
          {esc.root_cause && (
            <span style={{
              fontSize: 10, color: '#94A3B8', fontFamily: 'Inter, sans-serif',
              background: '#1A1F3A', border: '1px solid #2D3561', borderRadius: 4,
              padding: '1px 6px', display: 'inline-block', marginTop: 2,
            }}>
              {esc.root_cause}
            </span>
          )}
        </div>
        {isOverdue && (
          <span style={{ fontSize: 10, fontWeight: 600, color: '#EF4444', fontFamily: 'Inter, sans-serif', marginLeft: 8, flexShrink: 0 }}>
            OVERDUE
          </span>
        )}
      </div>
      {/* Progress bar */}
      <div style={{ height: 8, backgroundColor: '#2D3561', borderRadius: 4, overflow: 'hidden', marginTop: 6 }}>
        <div style={{
          height: '100%',
          width: `${rawPct}%`,
          backgroundColor: barColor,
          borderRadius: 4,
          transition: 'width 600ms ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 10, color: '#475569', fontFamily: 'Inter, sans-serif' }}>{Math.round(ageHours)}h elapsed</span>
        <span style={{ fontSize: 10, color: '#475569', fontFamily: 'Inter, sans-serif' }}>max {maxHours}h</span>
      </div>
    </div>
  )
}

export default function ResolutionTimeline({ cases }: Props) {
  if (!cases || cases.length === 0) {
    return (
      <div style={{ background: '#1A1F3A', border: '1px solid #2D3561', borderRadius: 12, padding: 16 }}>
        <div style={{ textAlign: 'center', color: '#475569', fontSize: 12, padding: '20px 0', fontFamily: 'Inter, sans-serif' }}>
          No open high priority cases
        </div>
      </div>
    )
  }

  const onTrack = cases.filter(c => {
    const pct = (c.age_hours || 0) / (c.max_resolution_hours || 48)
    return pct < 0.5
  }).length
  const atRisk = cases.filter(c => {
    const pct = (c.age_hours || 0) / (c.max_resolution_hours || 48)
    return pct >= 0.5 && pct < 0.8
  }).length
  const overdue = cases.filter(c => (c.age_hours || 0) > (c.max_resolution_hours || 48)).length

  return (
    <div className="card-lift" style={{ background: '#1A1F3A', border: '1px solid #2D3561', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontWeight: 500, fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif' }}>
          Resolution timeline
        </span>
        <span style={{ fontSize: 11, color: '#475569', fontFamily: 'Inter, sans-serif' }}>open escalations only</span>
      </div>

      {cases.map((c, i) => (
        <TimelineRow key={c.id} esc={c} isLast={i === cases.length - 1} />
      ))}

      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, marginTop: 12, borderTop: '1px solid #2D3561' }}>
        <span style={{ fontSize: 11, color: '#10B981', fontFamily: 'Inter, sans-serif' }}>On track: {onTrack}</span>
        <span style={{ fontSize: 11, color: '#F59E0B', fontFamily: 'Inter, sans-serif' }}>At risk: {atRisk}</span>
        <span style={{ fontSize: 11, color: '#EF4444', fontFamily: 'Inter, sans-serif' }}>Overdue: {overdue}</span>
      </div>
    </div>
  )
}
