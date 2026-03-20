'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import TopNav, { SIDEBAR_WIDTH } from '@/components/nav/TopNav'
import FilterBar from '@/components/nav/FilterBar'
import KpiStrip from '@/components/overview/KpiStrip'
import ScoreDistChart from '@/components/overview/ScoreDistChart'
import ChannelDonut from '@/components/overview/ChannelDonut'
import TierDonut from '@/components/overview/TierDonut'
import SlaBreachBars from '@/components/overview/SlaBreachBars'
import AgedCases from '@/components/overview/AgedCases'
import OwnershipLoad from '@/components/overview/OwnershipLoad'
import AvgScoreChart from '@/components/overview/AvgScoreChart'
import { SkeletonKpi } from '@/components/ui/Skeleton'
import { fetchStats, fetchRecentEscalations } from '@/lib/queries'
import { useAppStore } from '@/lib/store'
import type { Stats, EscalationRow } from '@/types'

type DatePreset = '1D' | '7D' | '30D' | '90D' | 'custom' | 'all'

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: 'All time', value: 'all' },
  { label: '1D', value: '1D' },
  { label: '7D', value: '7D' },
  { label: '30D', value: '30D' },
  { label: '90D', value: '90D' },
  { label: 'Custom', value: 'custom' },
]

function getPresetSince(preset: DatePreset): string | undefined {
  const now = new Date()
  if (preset === '1D') { now.setDate(now.getDate() - 1); return now.toISOString() }
  if (preset === '7D') { now.setDate(now.getDate() - 7); return now.toISOString() }
  if (preset === '30D') { now.setDate(now.getDate() - 30); return now.toISOString() }
  if (preset === '90D') { now.setDate(now.getDate() - 90); return now.toISOString() }
  return undefined
}

const FALLBACK_STATS: Stats = {
  totalOpen: 0, high: 0, medium: 0, low: 0, blocked: 0, slaBreach: 0, avgAge: 0,
  byChannel: { WhatsApp: 0, Slack: 0, Email: 0 },
  byTier: { Enterprise: 0, 'Mid-Market': 0, SMB: 0 },
  byStatus: { Open: 0, Blocked: 0, 'In Progress': 0, Closed: 0 },
  scoreDistribution: { '0-30': 0, '31-45': 0, '46-60': 0, '61-70': 0, '71-85': 0, '86-100': 0 },
  avgScoreBySegment: { Enterprise: 0, 'Mid-Market': 0, SMB: 0, WhatsApp: 0, Slack: 0, Email: 0 },
  dimAverages: { business: 0, timeAge: 0, comms: 0, complexity: 0, risk: 0, ownership: 0, historical: 0 },
  slaBreachBySegment: { Enterprise: 0, 'Mid-Market': 0, SMB: 0, WhatsApp: 0, Slack: 0, Email: 0 },
  oldestCases: [],
  ownershipLoad: [],
}

const PRIORITY_COLORS = {
  High: { text: '#DC2626', bg: '#FCEBEB' },
  Medium: { text: '#D97706', bg: '#FEF3C7' },
  Low: { text: '#059669', bg: '#D1FAE5' },
}
const CHANNEL_COLORS: Record<string, string> = {
  WhatsApp: '#059669', Slack: '#4F46E5', Email: '#7C3AED',
}
const STATUS_COLORS: Record<string, { text: string; bg: string }> = {
  Blocked: { text: '#DC2626', bg: '#FCEBEB' },
  Open: { text: '#D97706', bg: '#FEF3C7' },
  'In Progress': { text: '#4F46E5', bg: '#EEF2FF' },
  Closed: { text: '#059669', bg: '#D1FAE5' },
}

function RecentEscalationTable({
  rows,
  emptyLabel,
}: {
  rows: EscalationRow[]
  emptyLabel: string
}) {
  const router = useRouter()
  const { setFilter, clearAllFilters } = useAppStore()

  const handleRowClick = (esc: EscalationRow) => {
    clearAllFilters()
    router.push(`/dashboard/detail?account=${encodeURIComponent(esc.account_name)}`)
  }

  if (rows.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0', color: '#9E94BC', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
        {emptyLabel}
      </div>
    )
  }

  return (
    <div>
      {/* Table header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 90px 80px 60px 60px 80px',
          gap: 8,
          padding: '6px 14px',
          borderBottom: '1px solid #F3F4F6',
        }}
      >
        {['Account', 'Priority', 'Channel', 'Score', 'Age', 'Status'].map(h => (
          <span
            key={h}
            style={{ fontSize: 10, fontWeight: 600, color: '#9E94BC', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}
          >
            {h}
          </span>
        ))}
      </div>
      {rows.map(esc => {
        const ageDays = Math.round((esc.age_hours || 0) / 24)
        const pColors = PRIORITY_COLORS[esc.priority_bucket] || PRIORITY_COLORS.Low
        const sColors = STATUS_COLORS[esc.current_status] || STATUS_COLORS.Open
        return (
          <div
            key={esc.id}
            onClick={() => handleRowClick(esc)}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 90px 80px 60px 60px 80px',
              gap: 8,
              padding: '8px 14px',
              borderBottom: '1px solid #F6F3FF',
              cursor: 'pointer',
              transition: 'background 120ms',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = '#FDFCFF')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
          >
            <span
              style={{
                fontWeight: 500,
                fontSize: 12,
                color: '#1A0A2B',
                fontFamily: 'Inter, sans-serif',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {esc.account_name}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: pColors.text,
                backgroundColor: pColors.bg,
                borderRadius: 12,
                padding: '2px 8px',
                textAlign: 'center',
                alignSelf: 'center',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {esc.priority_bucket}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: CHANNEL_COLORS[esc.channel] || '#6B5E8B',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 11, color: '#6B5E8B', fontFamily: 'Inter, sans-serif' }}>{esc.channel}</span>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: esc.score >= 70 ? '#DC2626' : esc.score >= 45 ? '#D97706' : '#059669',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {esc.score}
            </span>
            <span
              style={{
                fontSize: 11,
                color: ageDays > 2 ? '#DC2626' : '#6B5E8B',
                fontFamily: 'Inter, sans-serif',
                fontWeight: ageDays > 2 ? 600 : 400,
              }}
            >
              {ageDays}d
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: sColors.text,
                backgroundColor: sColors.bg,
                borderRadius: 12,
                padding: '2px 8px',
                textAlign: 'center',
                alignSelf: 'center',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {esc.current_status}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function RecentSection({
  title,
  subtitle,
  badge,
  rows,
  emptyLabel,
  badgeColor,
}: {
  title: string
  subtitle: string
  badge: string
  rows: EscalationRow[]
  emptyLabel: string
  badgeColor: string
}) {
  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: 12,
        border: '1px solid #EDE8FD',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 16px 12px',
          borderBottom: '1px solid #F3F4F6',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontWeight: 600,
                fontSize: 13,
                color: '#1A0A2B',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {title}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: badgeColor,
                backgroundColor: badgeColor + '18',
                borderRadius: 20,
                padding: '2px 8px',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {badge}
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#9E94BC', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>
            {subtitle}
          </div>
        </div>
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: rows.length > 0 ? badgeColor : '#D1D5DB',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {rows.length}
        </span>
      </div>
      <RecentEscalationTable rows={rows} emptyLabel={emptyLabel} />
    </div>
  )
}

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [datePreset, setDatePreset] = useState<DatePreset>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [recentLoading, setRecentLoading] = useState(true)
  const [recent, setRecent] = useState<{ today: EscalationRow[]; thisWeek: EscalationRow[]; thisMonth: EscalationRow[] }>({
    today: [], thisWeek: [], thisMonth: [],
  })

  const loadStats = useCallback((preset: DatePreset, from?: string, to?: string) => {
    let since: string | undefined
    if (preset !== 'all' && preset !== 'custom') {
      since = getPresetSince(preset)
    } else if (preset === 'custom' && from) {
      since = new Date(from).toISOString()
    }

    setLoading(true)
    fetchStats(since)
      .then(setStats)
      .catch(err => {
        console.error('Failed to load stats:', err)
        setError('Failed to load dashboard data.')
        setStats(FALLBACK_STATS)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadStats('all')
    setRecentLoading(true)
    fetchRecentEscalations()
      .then(setRecent)
      .catch(console.error)
      .finally(() => setRecentLoading(false))
  }, [loadStats])

  const handlePreset = (preset: DatePreset) => {
    setDatePreset(preset)
    if (preset !== 'custom') loadStats(preset)
  }

  const handleCustomApply = () => {
    if (customFrom) loadStats('custom', customFrom, customTo)
  }

  const displayStats = stats || FALLBACK_STATS

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F6F3FF' }}>
      <TopNav />

      {/* Content shifted right of sidebar */}
      <div style={{ marginLeft: SIDEBAR_WIDTH, minHeight: '100vh' }}>
        <FilterBar />

        {error && (
          <div style={{ backgroundColor: '#FDEAEA', color: '#E53030', fontSize: 12, padding: '8px 20px', borderBottom: '1px solid #FCA5A5', fontFamily: 'Inter, sans-serif' }}>
            ⚠ {error}
          </div>
        )}

        {/* Date range filter bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 20px',
            backgroundColor: 'white',
            borderBottom: '1px solid #EDE8FD',
          }}
        >
          <span style={{ fontSize: 11, color: '#9E94BC', fontFamily: 'Inter, sans-serif', fontWeight: 600, marginRight: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Time range
          </span>
          {PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => handlePreset(p.value)}
              style={{
                fontSize: 11,
                fontWeight: datePreset === p.value ? 700 : 400,
                fontFamily: 'Inter, sans-serif',
                color: datePreset === p.value ? '#7308E3' : '#6B5E8B',
                backgroundColor: datePreset === p.value ? '#EDE8FD' : 'transparent',
                border: datePreset === p.value ? '1.5px solid #C4B5FD' : '1px solid #EDE8FD',
                borderRadius: 20,
                padding: '4px 12px',
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
            >
              {p.label}
            </button>
          ))}
          {datePreset === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                style={{
                  fontSize: 11,
                  fontFamily: 'Inter, sans-serif',
                  border: '1px solid #EDE8FD',
                  borderRadius: 6,
                  padding: '4px 8px',
                  color: '#1A0A2B',
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: 11, color: '#9E94BC' }}>to</span>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                style={{
                  fontSize: 11,
                  fontFamily: 'Inter, sans-serif',
                  border: '1px solid #EDE8FD',
                  borderRadius: 6,
                  padding: '4px 8px',
                  color: '#1A0A2B',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleCustomApply}
                disabled={!customFrom}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: 'Inter, sans-serif',
                  color: 'white',
                  backgroundColor: customFrom ? '#7308E3' : '#D9D0F8',
                  border: 'none',
                  borderRadius: 6,
                  padding: '5px 12px',
                  cursor: customFrom ? 'pointer' : 'not-allowed',
                }}
              >
                Apply
              </button>
            </div>
          )}
          <div style={{ flex: 1 }} />
          {datePreset !== 'all' && (
            <button
              onClick={() => handlePreset('all')}
              style={{
                fontSize: 11,
                color: '#7308E3',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                textDecoration: 'underline',
              }}
            >
              Reset
            </button>
          )}
        </div>

        <main style={{ padding: '16px 20px 24px' }}>
          {/* KPI Strip */}
          {loading ? (
            <div className="w-full bg-white border-b grid grid-cols-4" style={{ borderBottomColor: '#EDE8FD', borderRadius: 12, overflow: 'hidden' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ borderRight: i < 4 ? '1px solid #EDE8FD' : 'none' }}>
                  <SkeletonKpi />
                </div>
              ))}
            </div>
          ) : (
            <KpiStrip stats={displayStats} />
          )}

          {/* Row 1: Score distribution + Donuts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14, marginTop: 16, alignItems: 'start' }}>
            <ScoreDistChart data={displayStats.scoreDistribution} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <ChannelDonut data={displayStats.byChannel} />
              <TierDonut data={displayStats.byTier} />
            </div>
          </div>

          {/* Row 2: SLA Breach + Aged Cases + Ownership */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 14 }}>
            <SlaBreachBars data={displayStats.slaBreachBySegment} />
            <AgedCases cases={displayStats.oldestCases} />
            <OwnershipLoad owners={displayStats.ownershipLoad} />
          </div>

          {/* Row 3: Avg score chart */}
          <div style={{ marginTop: 14 }}>
            <AvgScoreChart data={displayStats.avgScoreBySegment} />
          </div>

          {/* Row 4: Recent escalations */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: '#1A0A2B',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Recent Escalations
              </span>
              <div style={{ flex: 1, height: 1, backgroundColor: '#EDE8FD' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <RecentSection
                title="Today"
                subtitle="Raised since midnight"
                badge="NEW"
                rows={recentLoading ? [] : recent.today}
                emptyLabel="No escalations raised today"
                badgeColor="#DC2626"
              />
              <RecentSection
                title="This Week"
                subtitle="Mon – yesterday"
                badge="WEEK"
                rows={recentLoading ? [] : recent.thisWeek}
                emptyLabel="No escalations this week (excl. today)"
                badgeColor="#D97706"
              />
              <RecentSection
                title="This Month"
                subtitle="1st – last week"
                badge="MONTH"
                rows={recentLoading ? [] : recent.thisMonth}
                emptyLabel="No escalations this month (excl. this week)"
                badgeColor="#4F46E5"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
