'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import EmployeePanel from './EmployeePanel'
import type { Stats } from '@/types'

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

interface Props {
  topPerformers?: Stats['topPerformers']
}

export default function TopNav({ topPerformers = [] }: Props) {
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
        backgroundColor: '#1A1F3A',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        boxShadow: '2px 0 12px rgba(0,0,0,0.4)',
        borderRight: '1px solid #2D3561',
      }}
    >
      {/* Logo section */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #2D3561' }}>
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
              boxShadow: '0 4px 12px rgba(79,70,229,0.4)',
              flexShrink: 0,
            }}
          >
            <span style={{ color: 'white', fontWeight: 800, fontSize: 18, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.5px' }}>P</span>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#F1F5F9', fontFamily: 'Inter, sans-serif', lineHeight: 1.2, letterSpacing: '-0.2px' }}>Plum</div>
            <div style={{ fontWeight: 400, fontSize: 10, color: '#475569', fontFamily: 'Inter, sans-serif', letterSpacing: '0.02em' }}>Escalation Command</div>
          </div>
        </div>
      </div>

      {/* Employee panel */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #2D3561' }}>
        <EmployeePanel topPerformers={topPerformers} />
      </div>

      {/* Live status */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 8, height: 8 }}>
          <span className="animate-ping" style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#10B981', opacity: 0.5 }} />
          <span style={{ position: 'relative', display: 'block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10B981' }} />
        </div>
        <span style={{ fontSize: 11, color: '#10B981', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>Live</span>
        {lastUpdated && (
          <span style={{ fontSize: 10, color: '#475569', fontFamily: 'Inter, sans-serif', marginLeft: 2 }}>{lastUpdated}</span>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '0 10px 10px', fontFamily: 'Inter, sans-serif' }}>
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
                padding: '9px 12px',
                borderRadius: 10,
                border: 'none',
                background: active
                  ? 'linear-gradient(135deg, rgba(79,70,229,0.3) 0%, rgba(79,70,229,0.15) 100%)'
                  : 'transparent',
                color: active ? '#F1F5F9' : '#94A3B8',
                fontWeight: active ? 600 : 400,
                fontSize: 13,
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                marginBottom: 3,
                textAlign: 'left',
                transition: 'all 150ms ease',
                boxShadow: active ? 'inset 0 0 0 1px rgba(79,70,229,0.4)' : 'none',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!active) {
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#F1F5F9'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#94A3B8'
                }
              }}
            >
              {active && (
                <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, backgroundColor: '#4F46E5', borderRadius: '0 2px 2px 0', boxShadow: '0 0 8px rgba(79,70,229,0.8)' }} />
              )}
              <span style={{ opacity: active ? 1 : 0.7, flexShrink: 0, marginLeft: active ? 6 : 0 }}>{item.icon}</span>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Divider */}
      <div style={{ padding: '0 16px 10px' }}>
        <div style={{ height: 1, backgroundColor: '#2D3561' }} />
      </div>

      {/* Get Briefing */}
      <div style={{ padding: '0 12px 20px' }}>
        <button
          onClick={handleGetBriefing}
          style={{
            width: '100%',
            fontWeight: 600,
            fontSize: 12,
            fontFamily: 'Inter, sans-serif',
            color: 'white',
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            border: 'none',
            borderRadius: 10,
            padding: '10px 14px',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(79,70,229,0.4)',
            transition: 'all 150ms ease',
            letterSpacing: '0.01em',
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(79,70,229,0.55)'
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(79,70,229,0.4)'
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
          }}
        >
          ✦ Get briefing
        </button>
      </div>
    </aside>
  )
}
