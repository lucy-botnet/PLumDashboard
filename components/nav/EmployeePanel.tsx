'use client'

import { useState, useEffect, useRef } from 'react'
import type { Stats } from '@/types'

interface Props {
  topPerformers: Stats['topPerformers']
}

// Hardcoded logged-in employee (first performer or default)
const LOGGED_IN_NAME = 'Riya Sharma'
const LOGGED_IN_ID = 'EMP-001'
const LOGGED_IN_ROLE = 'Senior Account Manager'

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const AVATAR_COLORS = ['#4F46E5', '#0891B2', '#7C3AED', '#059669', '#D97706']

export default function EmployeePanel({ topPerformers }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Personal stats (mock based on top performer data)
  const myPerf = topPerformers.find(p => p.name === LOGGED_IN_NAME)
  const resolvedThisMonth = myPerf?.resolved ?? Math.floor(Math.random() * 15) + 5
  const openCases = Math.floor(Math.random() * 12) + 3
  const avgResolution = Math.floor(Math.random() * 20) + 8
  const csatScore = Math.floor(Math.random() * 20) + 75

  const rankColors: Record<number, string> = { 1: '#F59E0B', 2: '#94A3B8', 3: '#D97706' }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Collapsed pill */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 10px 4px 4px',
          borderRadius: 8,
          border: 'none',
          background: open ? '#2D3561' : 'transparent',
          cursor: 'pointer',
          transition: 'background 150ms',
        }}
        onMouseEnter={e => { if (!open) (e.currentTarget as HTMLButtonElement).style.background = '#2D3561' }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: '50%', backgroundColor: '#4F46E5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 600, color: 'white', fontFamily: 'Inter, sans-serif', flexShrink: 0,
        }}>
          {getInitials(LOGGED_IN_NAME)}
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#F1F5F9', fontFamily: 'Inter, sans-serif', lineHeight: 1.3 }}>
            {LOGGED_IN_NAME}
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'Inter, sans-serif', lineHeight: 1.2 }}>
            {LOGGED_IN_ID}
          </div>
        </div>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: '#94A3B8', marginLeft: 2, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}>
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Expanded dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 8,
          width: 280,
          background: '#1A1F3A',
          border: '1px solid #2D3561',
          borderRadius: 12,
          zIndex: 50,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}>
          {/* Section 1: Profile */}
          <div style={{ padding: 16, borderBottom: '1px solid #2D3561', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', backgroundColor: '#4F46E5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 600, color: 'white', fontFamily: 'Inter, sans-serif', flexShrink: 0,
            }}>
              {getInitials(LOGGED_IN_NAME)}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}>{LOGGED_IN_NAME}</div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'Inter, sans-serif', marginTop: 1 }}>{LOGGED_IN_ROLE}</div>
              <span style={{
                display: 'inline-block', marginTop: 4,
                background: '#0F1128', border: '1px solid #2D3561', borderRadius: 4,
                padding: '1px 8px', fontSize: 10, fontWeight: 500, color: '#94A3B8', fontFamily: 'Inter, sans-serif',
              }}>
                {LOGGED_IN_ID}
              </span>
            </div>
          </div>

          {/* Section 2: Personal stats */}
          <div style={{ padding: 16, borderBottom: '1px solid #2D3561' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Open cases', value: String(openCases), color: '#F59E0B' },
                { label: 'Resolved this month', value: String(resolvedThisMonth), color: '#10B981' },
                { label: 'Avg resolution', value: `${avgResolution}h`, color: '#22D3EE' },
                { label: 'CSAT score', value: `${csatScore}%`, color: '#4F46E5' },
              ].map(cell => (
                <div key={cell.label} style={{ background: '#0F1128', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#475569', fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>{cell.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: cell.color, fontFamily: 'Inter, sans-serif' }}>{cell.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Leaderboard */}
          <div style={{ padding: 16, borderBottom: '1px solid #2D3561' }}>
            <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', fontFamily: 'Inter, sans-serif', marginBottom: 12 }}>
              Top performers this month
            </div>
            {topPerformers.length === 0 ? (
              <div style={{ fontSize: 11, color: '#475569', fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '8px 0' }}>
                No data available
              </div>
            ) : (
              topPerformers.map((p, i) => {
                const isMe = p.name === LOGGED_IN_NAME
                return (
                  <div
                    key={p.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '6px 4px',
                      borderRadius: 6,
                      marginBottom: i < topPerformers.length - 1 ? 4 : 0,
                      background: isMe ? '#1E2952' : 'transparent',
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: rankColors[i + 1] || '#475569', width: 14, textAlign: 'center', flexShrink: 0, fontFamily: 'Inter, sans-serif' }}>
                      {i + 1}
                    </span>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 600, color: 'white', fontFamily: 'Inter, sans-serif', flexShrink: 0,
                    }}>
                      {getInitials(p.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 500, color: '#F1F5F9', fontFamily: 'Inter, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name}
                        </span>
                        {isMe && (
                          <span style={{ background: '#4F46E5', color: 'white', fontSize: 9, fontWeight: 500, padding: '1px 5px', borderRadius: 4, fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>
                            You
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: '#475569', fontFamily: 'Inter, sans-serif' }}>
                        {p.employeeId || `EMP-00${i + 1}`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#22D3EE', fontFamily: 'Inter, sans-serif' }}>{p.resolved}</div>
                      <div style={{ fontSize: 10, color: '#475569', fontFamily: 'Inter, sans-serif' }}>resolved</div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Section 4: Footer */}
          <div style={{ padding: '10px 16px' }}>
            <button
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #2D3561',
                borderRadius: 8,
                background: 'transparent',
                color: '#94A3B8',
                fontSize: 12,
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                transition: 'background 150ms',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = '#0F1128')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
