'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function TopNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [lastUpdated, setLastUpdated] = useState('')

  useEffect(() => {
    const now = new Date()
    setLastUpdated(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
  }, [])

  const isOverview = pathname?.includes('overview')
  const isDetail = pathname?.includes('detail')

  return (
    <nav className="w-full bg-white border-b border-[#E5E7EB] px-6 flex items-center" style={{ height: 64 }}>
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center rounded-lg"
          style={{ width: 32, height: 32, backgroundColor: '#4F46E5', flexShrink: 0 }}
        >
          <span style={{ color: 'white', fontWeight: 700, fontSize: 18, fontFamily: 'Inter, sans-serif' }}>P</span>
        </div>
        <span style={{ fontWeight: 600, fontSize: 16, color: '#111827', fontFamily: 'Inter, sans-serif' }}>
          Escalation Command Centre
        </span>
      </div>

      {/* Center: Nav tabs */}
      <div className="flex-1 flex justify-center items-center gap-8">
        <button
          onClick={() => router.push('/dashboard/overview')}
          className="pb-1 transition-colors"
          style={{
            fontWeight: 500,
            fontSize: 14,
            fontFamily: 'Inter, sans-serif',
            color: isOverview ? '#4F46E5' : '#6B7280',
            background: 'none',
            border: 'none',
            borderBottom: isOverview ? '2px solid #4F46E5' : '2px solid transparent',
            cursor: 'pointer',
            paddingBottom: 4,
          }}
        >
          Overview
        </button>
        <button
          onClick={() => router.push('/dashboard/detail')}
          style={{
            fontWeight: 500,
            fontSize: 14,
            fontFamily: 'Inter, sans-serif',
            color: isDetail ? '#4F46E5' : '#6B7280',
            borderBottom: isDetail ? '2px solid #4F46E5' : '2px solid transparent',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            paddingBottom: 4,
          }}
        >
          Detail View
        </button>
      </div>

      {/* Right: Live indicator + button + time */}
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
          onClick={() => router.push('/dashboard/overview')}
          className="transition-colors"
          style={{
            fontWeight: 500,
            fontSize: 12,
            fontFamily: 'Inter, sans-serif',
            color: '#4F46E5',
            border: '1px solid #4F46E5',
            borderRadius: 8,
            padding: '6px 12px',
            background: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4F46E5'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'white'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#4F46E5'
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
