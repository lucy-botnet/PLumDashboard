'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'

export const SIDEBAR_WIDTH = 224

const NAV_ITEMS = [
  {
    label: 'Overview',
    key: 'overview',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    label: 'Detail View',
    key: 'detail',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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
      className="plum-sidebar"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: SIDEBAR_WIDTH,
        backgroundColor: '#1A0A2B',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        boxShadow: '2px 0 12px rgba(26, 10, 43, 0.4)',
      }}
    >
      {/* Logo section */}
      <div
        style={{
          padding: '20px 18px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #7308E3 0%, #9B3FF5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(115,8,227,0.5)',
              flexShrink: 0,
            }}
          >
            <span style={{ color: 'white', fontWeight: 800, fontSize: 20, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.5px' }}>P</span>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#FFFFFF', fontFamily: 'Inter, sans-serif', lineHeight: 1.2, letterSpacing: '-0.2px' }}>
              Plum
            </div>
            <div style={{ fontWeight: 400, fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: 'Inter, sans-serif', letterSpacing: '0.02em' }}>
              Escalation Command
            </div>
          </div>
        </div>
      </div>

      {/* Live status */}
      <div
        style={{
          padding: '10px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 8, height: 8 }}>
          <span
            className="animate-ping"
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              opacity: 0.5,
            }}
          />
          <span style={{ position: 'relative', display: 'block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10B981' }} />
        </div>
        <span style={{ fontSize: 11, color: '#10B981', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>Live</span>
        {lastUpdated && (
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif', marginLeft: 2 }}>
            {lastUpdated}
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.25)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            padding: '0 10px 10px',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Menu
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
                padding: '10px 12px',
                borderRadius: 10,
                border: 'none',
                background: active
                  ? 'linear-gradient(135deg, rgba(115,8,227,0.35) 0%, rgba(115,8,227,0.2) 100%)'
                  : 'transparent',
                color: active ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
                fontWeight: active ? 600 : 400,
                fontSize: 13,
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                marginBottom: 3,
                textAlign: 'left',
                transition: 'all 150ms ease',
                boxShadow: active ? 'inset 0 0 0 1px rgba(115,8,227,0.4)' : 'none',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!active) {
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.85)'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)'
                }
              }}
            >
              {/* Active accent bar */}
              {active && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: 20,
                    backgroundColor: '#7308E3',
                    borderRadius: '0 2px 2px 0',
                    boxShadow: '0 0 8px rgba(115,8,227,0.8)',
                  }}
                />
              )}
              <span style={{ opacity: active ? 1 : 0.7, flexShrink: 0, marginLeft: active ? 6 : 0 }}>
                {item.icon}
              </span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Divider with label */}
      <div style={{ padding: '0 20px 12px' }}>
        <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* Get Briefing */}
      <div style={{ padding: '0 14px 24px' }}>
        <button
          onClick={handleGetBriefing}
          style={{
            width: '100%',
            fontWeight: 600,
            fontSize: 12,
            fontFamily: 'Inter, sans-serif',
            color: 'white',
            background: 'linear-gradient(135deg, #7308E3 0%, #9B3FF5 100%)',
            border: 'none',
            borderRadius: 10,
            padding: '11px 14px',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(115,8,227,0.4)',
            transition: 'all 150ms ease',
            letterSpacing: '0.01em',
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(115,8,227,0.55)'
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(115,8,227,0.4)'
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
          }}
        >
          ✦ Get briefing
        </button>
      </div>
    </aside>
  )
}
