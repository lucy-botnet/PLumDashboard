'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'

export default function TopNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { setFilter, clearAllFilters } = useAppStore()
  const [lastUpdated, setLastUpdated] = useState('')

  useEffect(() => {
    const now = new Date()
    setLastUpdated(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
  }, [])

  const isOverview = pathname?.includes('overview')
  const isDetail = pathname?.includes('detail')
  const isGmail = pathname?.includes('gmail')

  const navTabStyle = (active: boolean) => ({
    fontWeight: active ? 600 : 400,
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
    color: active ? '#4F46E5' : '#6B7280',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid #4F46E5' : '2px solid transparent',
    cursor: 'pointer',
    paddingBottom: 4,
    paddingTop: 4,
    paddingLeft: 0,
    paddingRight: 0,
    transition: 'color 150ms, border-color 150ms',
  })

  const handleOverview = () => {
    clearAllFilters()
    router.push('/dashboard/overview')
  }

  const handleDetail = () => {
    router.push('/dashboard/detail')
  }

  const handleGetBriefing = () => {
    clearAllFilters()
    setFilter('priority', 'High')
    setFilter('sortBy', 'score_desc')
    router.push('/dashboard/detail')
  }

  return (
    <nav
      className="w-full bg-white border-b border-[#E5E7EB] px-6 flex items-center"
      style={{ height: 64, boxShadow: '0 1px 0 #E5E7EB' }}
    >
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center rounded-lg"
          style={{
            width: 32,
            height: 32,
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(79,70,229,0.3)',
          }}
        >
          <span style={{ color: 'white', fontWeight: 700, fontSize: 18, fontFamily: 'Inter, sans-serif' }}>P</span>
        </div>
        <span style={{ fontWeight: 600, fontSize: 16, color: '#111827', fontFamily: 'Inter, sans-serif' }}>
          Escalation Command Centre
        </span>
      </div>

      {/* Center: Nav tabs */}
      <div className="flex-1 flex justify-center items-center gap-8">
        <button onClick={handleOverview} style={navTabStyle(isOverview)}>
          Overview
        </button>
        <button onClick={handleDetail} style={navTabStyle(isDetail)}>
          Detail View
        </button>
        <button
          onClick={() => router.push('/gmail-sync')}
          style={navTabStyle(isGmail)}
        >
          Gmail Sync
        </button>
      </div>

      {/* Right: Live indicator + briefing button + time */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="relative flex items-center justify-center" style={{ width: 8, height: 8 }}>
            <span
              className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
              style={{ backgroundColor: '#059669' }}
            />
            <span
              className="relative inline-flex rounded-full"
              style={{ width: 8, height: 8, backgroundColor: '#059669' }}
            />
          </div>
          <span style={{ fontWeight: 400, fontSize: 11, color: '#059669', fontFamily: 'Inter, sans-serif' }}>Live</span>
        </div>

        <button
          onClick={handleGetBriefing}
          className="transition-all"
          style={{
            fontWeight: 500,
            fontSize: 12,
            fontFamily: 'Inter, sans-serif',
            color: 'white',
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            border: 'none',
            borderRadius: 8,
            padding: '7px 14px',
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(79,70,229,0.25)',
            transition: 'all 150ms',
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(79,70,229,0.35)'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 4px rgba(79,70,229,0.25)'
          }}
        >
          Get briefing ↗
        </button>

        {lastUpdated && (
          <span style={{ fontWeight: 400, fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>
            Updated {lastUpdated}
          </span>
        )}
      </div>
    </nav>
  )
}
