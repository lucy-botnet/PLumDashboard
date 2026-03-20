'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'

export const SIDEBAR_WIDTH = 220

const NAV_ITEMS = [
  {
    label: 'Overview',
    key: 'overview',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    ),
  },
  {
    label: 'Detail View',
    key: 'detail',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export default function TopNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { setFilter, clearAllFilters } = useAppStore()
  const [lastUpdated, setLastUpdated] = useState('')

  useEffect(() => {
    const now = new Date()
    setLastUpdated(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
  }, [])

  const activeKey = pathname?.includes('overview')
    ? 'overview'
    : pathname?.includes('detail')
    ? 'detail'
    : ''

  const handleNav = (key: string) => {
    if (key === 'overview') { clearAllFilters(); router.push('/dashboard/overview') }
    else if (key === 'detail') { router.push('/dashboard/detail') }
  }

  const handleGetBriefing = () => {
    clearAllFilters()
    setFilter('priority', 'High')
    setFilter('sortBy', 'score_desc')
    router.push('/dashboard/detail')
  }

  return (
    <aside
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: SIDEBAR_WIDTH,
        backgroundColor: 'white',
        borderRight: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        boxShadow: '1px 0 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
              flexShrink: 0,
            }}
          >
            <span style={{ color: 'white', fontWeight: 800, fontSize: 18, fontFamily: 'Inter, sans-serif' }}>P</span>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', fontFamily: 'Inter, sans-serif', lineHeight: 1.3 }}>
              Escalation
            </div>
            <div style={{ fontWeight: 400, fontSize: 10, color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>
              Command Centre
            </div>
          </div>
        </div>
      </div>

      {/* Live status */}
      <div style={{ padding: '8px 18px', borderBottom: '1px solid #F9FAFB', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 8, height: 8 }}>
          <span
            className="animate-ping"
            style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#059669', opacity: 0.5 }}
          />
          <span style={{ position: 'relative', display: 'block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#059669' }} />
        </div>
        <span style={{ fontSize: 11, color: '#059669', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>Live</span>
        {lastUpdated && (
          <span style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'Inter, sans-serif', marginLeft: 2 }}>
            · {lastUpdated}
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '14px 10px' }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: '#9CA3AF',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            padding: '0 10px 10px',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Navigation
        </div>
        {NAV_ITEMS.map(item => {
          const active = activeKey === item.key
          return (
            <button
              key={item.key}
              onClick={() => handleNav(item.key)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 10px 9px 12px',
                borderRadius: 8,
                border: 'none',
                borderLeft: active ? '3px solid #4F46E5' : '3px solid transparent',
                background: active ? '#EEF2FF' : 'transparent',
                color: active ? '#4F46E5' : '#6B7280',
                fontWeight: active ? 600 : 400,
                fontSize: 13,
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                marginBottom: 2,
                textAlign: 'left',
                transition: 'background 150ms, color 150ms, border-color 150ms',
              }}
              onMouseEnter={e => {
                if (!active) {
                  ;(e.currentTarget as HTMLButtonElement).style.background = '#F9FAFB'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#374151'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#6B7280'
                }
              }}
            >
              <span style={{ opacity: active ? 1 : 0.7, flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Get Briefing */}
      <div style={{ padding: '12px 14px 20px', borderTop: '1px solid #F3F4F6' }}>
        <button
          onClick={handleGetBriefing}
          style={{
            width: '100%',
            fontWeight: 500,
            fontSize: 12,
            fontFamily: 'Inter, sans-serif',
            color: 'white',
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            border: 'none',
            borderRadius: 8,
            padding: '9px 14px',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(79,70,229,0.25)',
            transition: 'box-shadow 150ms, transform 150ms',
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(79,70,229,0.38)'
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 6px rgba(79,70,229,0.25)'
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
          }}
        >
          Get briefing ↗
        </button>
      </div>
    </aside>
  )
}
