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
import ResponseCsatStrip from '@/components/overview/ResponseCsatStrip'
import TicketsTrendChart from '@/components/overview/TicketsTrendChart'
import RootCauseChart from '@/components/overview/RootCauseChart'
import ResolutionTimeline from '@/components/overview/ResolutionTimeline'
import B2BvsB2C from '@/components/overview/B2BvsB2C'
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
  rootCauseData: [],
  b2bVsB2c: { b2bCount: 0, b2cCount: 0, byPriority: [] },
  responseCsat: { lastMonthAvgResponseHours: 0, currentMonthAvgResponseHours: 0, lastMonthCsat: 0, currentMonthCsat: 0 },
  openHighPriorityForTimeline: [],
  ticketsTrend: [],
  topPerformers: [],
}

const PRIORITY_COLORS = {
  High: { text: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  Medium: { text: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  Low: { text: '#10B981', bg: 'rgba(16,185,129,0.12)' },
}
const CHANNEL_COLORS: Record<string, string> = {
  WhatsApp: '#10B981', Slack: '#4F46E5', Email: '#8B5CF6',
}
const STATUS_COLORS: Record<string, { text: string; bg: string }> = {
  Blocked: { text: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  Open: { text: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  'In Progress': { text: '#4F46E5', bg: 'rgba(79,70,229,0.15)' },
  Closed: { text: '#10B981', bg: 'rgba(16,185,129,0.12)' },
}

function RecentEscalationTable({ rows, emptyLabel }: { rows: EscalationRow[]; emptyLabel: string }) {
  const router = useRouter()
  const { clearAllFilters } = useAppStore()

  const handleRowClick = (esc: EscalationRow) => {
    clearAllFilters()
    router.push(`/dashboard/detail?account=${encodeURIComponent(esc.account_name)}`)
  }

  if (rows.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '12px 0', color: '#475569', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
        {emptyLabel}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 70px 50px 50px 75px', gap: 6, padding: '5px 12px', borderBottom: '1px solid #2D3561' }}>
        {['Account', 'Priority', 'Channel', 'Score', 'Age', 'Status'].map(h => (
          <span key={h} style={{ fontSize: 9, fontWeight: 600, color: '#475569', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
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
            style={{ display: 'grid', gridTemplateColumns: '1fr 80px 70px 50px 50px 75px', gap: 6, padding: '7px 12px', borderBottom: '1px solid rgba(45,53,97,0.5)', cursor: 'pointer', transition: 'background 120ms' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = '#1E2952')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
          >
            <span style={{ fontWeight: 500, fontSize: 11, color: '#F1F5F9', fontFamily: 'Inter, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {esc.account_name}
            </span>
            <span style={{ fontSize: 9, fontWeight: 600, color: pColors.text, backgroundColor: pColors.bg, borderRadius: 12, padding: '2px 7px', textAlign: 'center', alignSelf: 'center', fontFamily: 'Inter, sans-serif' }}>
              {esc.priority_bucket}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: CHANNEL_COLORS[esc.channel] || '#94A3B8', flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>{esc.channel}</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: esc.score >= 70 ? '#EF4444' : esc.score >= 45 ? '#F59E0B' : '#10B981', fontFamily: 'Inter, sans-serif' }}>
              {esc.score}
            </span>
            <span style={{ fontSize: 10, color: ageDays > 2 ? '#EF4444' : '#94A3B8', fontFamily: 'Inter, sans-serif', fontWeight: ageDays > 2 ? 600 : 400 }}>
              {ageDays}d
            </span>
            <span style={{ fontSize: 9, fontWeight: 500, color: sColors.text, backgroundColor: sColors.bg, borderRadius: 12, padding: '2px 7px', textAlign: 'center', alignSelf: 'center', fontFamily: 'Inter, sans-serif' }}>
              {esc.current_status}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function RecentSection({ title, subtitle, badge, rows, emptyLabel, badgeColor }: {
  title: string; subtitle: string; badge: string; rows: EscalationRow[]; emptyLabel: string; badgeColor: string
}) {
  return (
    <div style={{ backgroundColor: '#1A1F3A', borderRadius: 12, border: '1px solid #2D3561', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid #2D3561' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}>{title}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: badgeColor, backgroundColor: badgeColor + '22', borderRadius: 20, padding: '2px 8px', fontFamily: 'Inter, sans-serif' }}>
              {badge}
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#475569', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>{subtitle}</div>
        </div>
        <span style={{ fontSize: 18, fontWeight: 700, color: rows.length > 0 ? badgeColor : '#2D3561', fontFamily: 'Inter, sans-serif' }}>
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

  const loadStats = useCallback((preset: DatePreset, from?: string) => {
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
    if (customFrom) loadStats('custom', customFrom)
  }

  const displayStats = stats || FALLBACK_STATS

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0F1128' }}>
      <TopNav topPerformers={displayStats.topPerformers} />

      <div style={{ marginLeft: SIDEBAR_WIDTH, minHeight: '100vh' }}>
        <FilterBar />

        {error && (
          <div style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444', fontSize: 12, padding: '8px 20px', borderBottom: '1px solid rgba(239,68,68,0.3)', fontFamily: 'Inter, sans-serif' }}>
            ⚠ {error}
          </div>
        )}

        {/* Date range filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', backgroundColor: '#1A1F3A', borderBottom: '1px solid #2D3561' }}>
          <span style={{ fontSize: 10, color: '#475569', fontFamily: 'Inter, sans-serif', fontWeight: 600, marginRight: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Time range
          </span>
          {PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => handlePreset(p.value)}
              style={{
                fontSize: 11, fontWeight: datePreset === p.value ? 700 : 400,
                fontFamily: 'Inter, sans-serif',
                color: datePreset === p.value ? 'white' : '#94A3B8',
                backgroundColor: datePreset === p.value ? '#4F46E5' : 'transparent',
                border: datePreset === p.value ? 'none' : '1px solid #2D3561',
                borderRadius: 20, padding: '3px 12px', cursor: 'pointer', transition: 'all 150ms',
              }}
            >
              {p.label}
            </button>
          ))}
          {datePreset === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
              <input
                type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                style={{ fontSize: 11, fontFamily: 'Inter, sans-serif', border: '1px solid #2D3561', borderRadius: 6, padding: '4px 8px', color: '#F1F5F9', background: '#0F1128', outline: 'none' }}
              />
              <span style={{ fontSize: 11, color: '#475569' }}>to</span>
              <input
                type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                style={{ fontSize: 11, fontFamily: 'Inter, sans-serif', border: '1px solid #2D3561', borderRadius: 6, padding: '4px 8px', color: '#F1F5F9', background: '#0F1128', outline: 'none' }}
              />
              <button
                onClick={handleCustomApply} disabled={!customFrom}
                style={{ fontSize: 11, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: 'white', backgroundColor: customFrom ? '#4F46E5' : '#2D3561', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: customFrom ? 'pointer' : 'not-allowed' }}
              >
                Apply
              </button>
            </div>
          )}
          <div style={{ flex: 1 }} />
          {datePreset !== 'all' && (
            <button onClick={() => handlePreset('all')} style={{ fontSize: 11, color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 500, textDecoration: 'underline' }}>
              Reset
            </button>
          )}
        </div>

        <main style={{ padding: '12px 16px 24px' }}>
          {/* KPI Strip */}
          {loading ? (
            <div className="w-full grid grid-cols-4" style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #2D3561' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ borderRight: i < 4 ? '1px solid #2D3561' : 'none' }}>
                  <SkeletonKpi />
                </div>
              ))}
            </div>
          ) : (
            <KpiStrip stats={displayStats} />
          )}

          {/* Response/CSAT strip */}
          <div style={{ marginTop: 12 }}>
            <ResponseCsatStrip data={displayStats.responseCsat} />
          </div>

          {/* Tickets trend */}
          <div style={{ marginTop: 12 }}>
            <TicketsTrendChart data={displayStats.ticketsTrend} />
          </div>

          {/* Row 1: Score distribution + Donuts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 12, marginTop: 12, alignItems: 'start' }}>
            <ScoreDistChart data={displayStats.scoreDistribution} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ChannelDonut data={displayStats.byChannel} />
              <TierDonut data={displayStats.byTier} />
            </div>
          </div>

          {/* Root cause analysis — full width */}
          <div style={{ marginTop: 12 }}>
            <RootCauseChart data={displayStats.rootCauseData} />
          </div>

          {/* Row 2: SLA Breach + Aged Cases + Resolution Timeline */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
            <SlaBreachBars data={displayStats.slaBreachBySegment} />
            <AgedCases cases={displayStats.oldestCases} />
            <ResolutionTimeline cases={displayStats.openHighPriorityForTimeline} />
          </div>

          {/* Row 3: B2B vs B2C + (AvgScore + OwnershipLoad) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <B2BvsB2C data={displayStats.b2bVsB2c} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <AvgScoreChart data={displayStats.avgScoreBySegment} />
              <OwnershipLoad owners={displayStats.ownershipLoad} />
            </div>
          </div>

          {/* Recent escalations */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}>Recent Escalations</span>
              <div style={{ flex: 1, height: 1, backgroundColor: '#2D3561' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <RecentSection
                title="Today" subtitle="Raised since midnight" badge="NEW"
                rows={recentLoading ? [] : recent.today}
                emptyLabel="No escalations raised today" badgeColor="#EF4444"
              />
              <RecentSection
                title="This Week" subtitle="Mon – yesterday" badge="WEEK"
                rows={recentLoading ? [] : recent.thisWeek}
                emptyLabel="No escalations this week (excl. today)" badgeColor="#F59E0B"
              />
              <RecentSection
                title="This Month" subtitle="1st – last week" badge="MONTH"
                rows={recentLoading ? [] : recent.thisMonth}
                emptyLabel="No escalations this month (excl. this week)" badgeColor="#4F46E5"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
