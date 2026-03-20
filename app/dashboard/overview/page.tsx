'use client'

import { useEffect, useState } from 'react'
import TopNav from '@/components/nav/TopNav'
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
import { fetchStats } from '@/lib/queries'
import type { Stats } from '@/types'

const FALLBACK_STATS: Stats = {
  totalOpen: 0,
  high: 0,
  medium: 0,
  low: 0,
  blocked: 0,
  slaBreach: 0,
  avgAge: 0,
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

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(err => {
        console.error('Failed to load stats:', err)
        setError('Failed to load dashboard data. Check your Supabase configuration.')
        setStats(FALLBACK_STATS)
      })
      .finally(() => setLoading(false))
  }, [])

  const displayStats = stats || FALLBACK_STATS

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <TopNav />
      <FilterBar />

      {error && (
        <div
          style={{
            backgroundColor: '#FCEBEB',
            color: '#DC2626',
            fontSize: 12,
            padding: '8px 24px',
            borderBottom: '1px solid #F09595',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          ⚠ {error}
        </div>
      )}

      <main className="px-6 py-0">
        {/* KPI Strip */}
        {loading ? (
          <div className="w-full bg-white border-b grid grid-cols-4" style={{ borderBottomColor: '#E5E7EB' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ borderRight: i < 4 ? '1px solid #E5E7EB' : 'none' }}>
                <SkeletonKpi />
              </div>
            ))}
          </div>
        ) : (
          <KpiStrip stats={displayStats} />
        )}

        {/* Main chart row */}
        <div className="grid grid-cols-3 gap-4 mt-5">
          <div className="col-span-2">
            <ScoreDistChart data={displayStats.scoreDistribution} />
          </div>
          <div className="flex flex-col gap-4">
            <ChannelDonut data={displayStats.byChannel} />
            <TierDonut data={displayStats.byTier} />
          </div>
        </div>

        {/* Bottom three-column row */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <SlaBreachBars data={displayStats.slaBreachBySegment} />
          <AgedCases cases={displayStats.oldestCases} />
          <OwnershipLoad owners={displayStats.ownershipLoad} />
        </div>

        {/* Full-width bottom row */}
        <div className="mt-4 mb-6">
          <AvgScoreChart data={displayStats.avgScoreBySegment} />
        </div>
      </main>
    </div>
  )
}
