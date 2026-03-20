'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import TopNav, { SIDEBAR_WIDTH } from '@/components/nav/TopNav'
import FilterBar from '@/components/nav/FilterBar'
import FilterStrip from '@/components/detail/FilterStrip'
import RecordCard from '@/components/detail/RecordCard'
import Pagination from '@/components/detail/Pagination'
import DraftModal from '@/components/detail/DraftModal'
import { SkeletonCards } from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import { fetchEscalations, fetchOwners } from '@/lib/queries'
import { useAppStore } from '@/lib/store'
import type { EscalationRow, GroupedAccount, FilterState } from '@/types'

const PAGE_SIZE = 20

export default function DetailPageContent() {
  const store = useAppStore()
  const searchParams = useSearchParams()

  const [records, setRecords] = useState<GroupedAccount[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalEscalations, setTotalEscalations] = useState(0)
  const [loading, setLoading] = useState(true)
  const [owners, setOwners] = useState<string[]>([])
  const [expandedAcc, setExpandedAcc] = useState<string | null>(null)
  const [draftTarget, setDraftTarget] = useState<EscalationRow | null>(null)
  const [initialized, setInitialized] = useState(false)

  // Init store from URL params on first load
  useEffect(() => {
    store.initFromUrl()
    const accountParam = searchParams?.get('account')
    if (accountParam) {
      setExpandedAcc(decodeURIComponent(accountParam))
    }
    setInitialized(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch owners once
  useEffect(() => {
    fetchOwners().then(setOwners).catch(console.error)
  }, [])

  // Build filter state snapshot for dep comparison
  const filterKey = JSON.stringify({
    priority: store.priority,
    status: store.status,
    channel: store.channel,
    tier: store.tier,
    owner: store.owner,
    scoreRange: store.scoreRange,
    sortBy: store.sortBy,
    search: store.search,
    page: store.page,
    _refreshKey: store._refreshKey,
  })

  useEffect(() => {
    if (!initialized) return
    setLoading(true)
    const filters: FilterState = {
      priority: store.priority,
      status: store.status,
      channel: store.channel,
      tier: store.tier,
      owner: store.owner,
      scoreRange: store.scoreRange,
      sortBy: store.sortBy,
      search: store.search,
      page: store.page,
    }

    fetchEscalations(filters)
      .then(({ data, count }) => {
        setRecords(data)
        setTotalCount(count)
        setTotalEscalations(data.reduce((s, a) => s + a.escalations.length, 0))
      })
      .catch(err => {
        console.error('Failed to fetch escalations:', err)
        setRecords([])
        setTotalCount(0)
      })
      .finally(() => setLoading(false))
  }, [filterKey, initialized]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = useCallback((name: string) => {
    setExpandedAcc(prev => prev === name ? null : name)
  }, [])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <TopNav />
      <div style={{ marginLeft: SIDEBAR_WIDTH, minHeight: '100vh' }}>
      <FilterBar />
      <FilterStrip
        totalAccounts={totalCount}
        totalEscalations={totalEscalations}
        owners={owners}
      />

      <main className="px-6 py-4">
        {loading && <SkeletonCards count={6} />}

        {!loading && records.length === 0 && <EmptyState />}

        {!loading && records.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {records.map(account => (
              <RecordCard
                key={account.name}
                account={account}
                isExpanded={expandedAcc === account.name}
                onToggle={handleToggle}
                onDraft={setDraftTarget}
              />
            ))}
          </div>
        )}

        <Pagination totalPages={totalPages} />
      </main>

      <DraftModal
        escalation={draftTarget}
        isOpen={!!draftTarget}
        onClose={() => setDraftTarget(null)}
      />
      </div>
    </div>
  )
}
