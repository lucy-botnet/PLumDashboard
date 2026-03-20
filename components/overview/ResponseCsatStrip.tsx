'use client'

import type { Stats } from '@/types'

interface Props {
  data: Stats['responseCsat']
}

function formatHours(h: number): string {
  if (!h) return '—'
  const hours = Math.floor(h)
  const mins = Math.round((h - hours) * 60)
  return `${hours}:${String(mins).padStart(2, '0')} hr`
}

export default function ResponseCsatStrip({ data }: Props) {
  const {
    lastMonthAvgResponseHours,
    currentMonthAvgResponseHours,
    lastMonthCsat,
    currentMonthCsat,
  } = data

  const responseDelta = lastMonthAvgResponseHours - currentMonthAvgResponseHours
  const responseImproved = responseDelta > 0 // lower is better
  const responseColor = responseImproved ? '#10B981' : '#EF4444'
  const responseBorderColor = responseImproved ? '#10B981' : '#EF4444'

  const csatDelta = currentMonthCsat - lastMonthCsat
  const csatImproved = csatDelta >= 0
  const csatColor = csatImproved ? '#10B981' : '#EF4444'

  const cardStyle: React.CSSProperties = {
    background: '#1A1F3A',
    border: '1px solid #2D3561',
    borderRadius: 12,
    padding: 16,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  }

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      {/* Card 1: Response Time */}
      <div style={cardStyle} className="card-lift">
        <div>
          <div style={{ fontWeight: 500, fontSize: 13, color: '#94A3B8', fontFamily: 'Inter, sans-serif', marginBottom: 12 }}>
            Average Response Time
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 22, color: '#F1F5F9', fontFamily: 'Inter, sans-serif', lineHeight: 1.2 }}>
              {formatHours(lastMonthAvgResponseHours)}
            </div>
            <div style={{ fontSize: 11, color: '#475569', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>Last Month</div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 22, color: currentMonthAvgResponseHours < lastMonthAvgResponseHours ? '#10B981' : '#EF4444', fontFamily: 'Inter, sans-serif', lineHeight: 1.2 }}>
              {formatHours(currentMonthAvgResponseHours)}
            </div>
            <div style={{ fontSize: 11, color: '#475569', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>Current Month</div>
          </div>
        </div>
        <div style={{
          border: `1px solid ${responseBorderColor}`,
          borderRadius: 8,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          minWidth: 90,
          boxShadow: `0 0 12px ${responseBorderColor}22 inset`,
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            {responseImproved ? (
              <path d="M10 3L10 17M10 17L4 11M10 17L16 11" stroke={responseColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            ) : (
              <path d="M10 17L10 3M10 3L4 9M10 3L16 9" stroke={responseColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            )}
          </svg>
          <div style={{ fontWeight: 700, fontSize: 18, color: responseColor, fontFamily: 'Inter, sans-serif' }}>
            {responseImproved ? '-' : '+'}{formatHours(Math.abs(responseDelta))}
          </div>
        </div>
      </div>

      {/* Card 2: CSAT */}
      <div style={cardStyle} className="card-lift">
        <div>
          <div style={{ fontWeight: 500, fontSize: 13, color: '#94A3B8', fontFamily: 'Inter, sans-serif', marginBottom: 12 }}>
            Customer Satisfaction Score (CSAT)
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 22, color: '#F1F5F9', fontFamily: 'Inter, sans-serif', lineHeight: 1.2 }}>
              {lastMonthCsat ? `${Math.round(lastMonthCsat)}%` : '—'}
            </div>
            <div style={{ fontSize: 11, color: '#475569', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>Last Month</div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 22, color: csatImproved ? '#10B981' : '#EF4444', fontFamily: 'Inter, sans-serif', lineHeight: 1.2 }}>
              {currentMonthCsat ? `${Math.round(currentMonthCsat)}%` : '—'}
            </div>
            <div style={{ fontSize: 11, color: '#475569', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>Current Month</div>
          </div>
        </div>
        <div style={{
          border: `1px solid ${csatColor}`,
          borderRadius: 8,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          minWidth: 90,
          boxShadow: `0 0 12px ${csatColor}30 inset`,
        }}>
          <div style={{ fontWeight: 800, fontSize: 28, color: '#F1F5F9', fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
            {currentMonthCsat ? Math.round(currentMonthCsat) : '—'}
            <sup style={{ fontSize: 14, fontWeight: 600 }}>%</sup>
          </div>
          <div style={{ fontSize: 11, color: csatColor, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
            {csatImproved ? '▲' : '▼'} {Math.abs(Math.round(csatDelta))}pts
          </div>
        </div>
      </div>
    </div>
  )
}
