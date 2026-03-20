'use client'

import { useRef, useEffect, useState } from 'react'
import type { EscalationRow, GroupedAccount } from '@/types'

interface Props {
  account: GroupedAccount
  isExpanded: boolean
  onToggle: (name: string) => void
  onDraft: (escalation: EscalationRow) => void
}

const PRIORITY_COLORS = {
  High:   { text: '#E53030', bg: '#FDEAEA', border: '#FCA5A5' },
  Medium: { text: '#D97706', bg: '#FEF3C7', border: '#FCD34D' },
  Low:    { text: '#059669', bg: '#D1FAE5', border: '#6EE7B7' },
}

const STATUS_COLORS = {
  Blocked:      { text: '#E53030', bg: '#FDEAEA' },
  Open:         { text: '#D97706', bg: '#FEF3C7' },
  'In Progress':{ text: '#7308E3', bg: '#EDE8FD' },
  Closed:       { text: '#059669', bg: '#D1FAE5' },
}

const CHANNEL_COLORS = {
  WhatsApp: { text: '#059669', bg: '#D1FAE5', border: '#6EE7B7' },
  Slack:    { text: '#7308E3', bg: '#EDE8FD', border: '#C4B5FD' },
  Email:    { text: '#9B3FF5', bg: '#F3E8FF', border: '#DDD6FE' },
}

function Pill({ label, colors }: { label: string; colors: { text: string; bg: string; border?: string } }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        fontFamily: 'Inter, sans-serif',
        color: colors.text,
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border || colors.bg}`,
        borderRadius: 20,
        padding: '2px 8px',
        letterSpacing: '0.01em',
      }}
    >
      {label}
    </span>
  )
}

function EscalationItem({ esc, onDraft }: { esc: EscalationRow; onDraft: (e: EscalationRow) => void }) {
  const pColors = PRIORITY_COLORS[esc.priority_bucket] || PRIORITY_COLORS.Low
  const sColors = STATUS_COLORS[esc.current_status] || STATUS_COLORS.Open
  const cColors = CHANNEL_COLORS[esc.channel] || CHANNEL_COLORS.Email
  const ageDays = Math.round((esc.age_hours || 0) / 24)

  const summary = esc.ai_summary
    ? esc.ai_summary
    : esc.message
    ? esc.message.replace(/\s+/g, ' ').trim()
    : null
  const summaryPreview = summary ? (summary.length > 130 ? summary.slice(0, 130) + '…' : summary) : null

  return (
    <div
      className="border-b last:border-b-0 transition-colors"
      style={{ borderBottomColor: '#EDE8FD' }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = '#FDFCFF')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
    >
      {/* Row: ID / subject / pills / score / draft */}
      <div className="flex items-center gap-3 px-5 pt-3 pb-1">
        <span style={{ fontWeight: 500, fontSize: 10, color: '#9E94BC', width: 80, flexShrink: 0, fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em' }}>
          {esc.escalation_id}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500, fontSize: 12, color: '#1A0A2B', fontFamily: 'Inter, sans-serif', textTransform: 'capitalize' }}>
            {esc.subject || esc.priority_hint || 'general'}
          </div>
          <div className="flex gap-1 mt-1">
            <Pill label={esc.channel} colors={cColors} />
            <Pill label={esc.current_status} colors={sColors} />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span style={{ fontWeight: 700, fontSize: 13, color: pColors.text, fontFamily: 'Inter, sans-serif' }}>
            {esc.score}
          </span>
          <span style={{ fontWeight: 400, fontSize: 11, color: '#9E94BC', fontFamily: 'Inter, sans-serif' }}>
            {ageDays}d
          </span>
          <button
            onClick={e => { e.stopPropagation(); onDraft(esc) }}
            style={{
              fontWeight: 600,
              fontSize: 11,
              padding: '4px 10px',
              border: '1.5px solid #7308E3',
              color: '#7308E3',
              borderRadius: 6,
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 150ms',
            }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = '#7308E3'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'white'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#7308E3'
            }}
          >
            Draft
          </button>
        </div>
      </div>
      {/* Message summary */}
      {summaryPreview && (
        <div
          style={{
            marginLeft: 100,
            marginRight: 16,
            marginBottom: 10,
            padding: '6px 12px',
            backgroundColor: '#F6F3FF',
            borderRadius: 6,
            borderLeft: '2px solid #D9D0F8',
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 400, color: '#6B5E8B', fontFamily: 'Inter, sans-serif', lineHeight: 1.55 }}>
            {summaryPreview}
          </span>
        </div>
      )}
    </div>
  )
}

export default function RecordCard({ account, isExpanded, onToggle, onDraft }: Props) {
  const pColors = PRIORITY_COLORS[account.topPriority] || PRIORITY_COLORS.Low
  const sColors = STATUS_COLORS[account.topStatus as keyof typeof STATUS_COLORS] || STATUS_COLORS.Open
  const cColors = CHANNEL_COLORS[account.topChannel as keyof typeof CHANNEL_COLORS] || CHANNEL_COLORS.Email
  const isBlocked = account.topStatus === 'Blocked'
  const isHighPriority = account.topPriority === 'High'
  const topEsc = account.escalations[0]
  const ageDays = topEsc ? Math.round((topEsc.age_hours || 0) / 24) : 0

  const panelRef = useRef<HTMLDivElement>(null)
  const [panelHeight, setPanelHeight] = useState(0)

  useEffect(() => {
    if (panelRef.current) {
      setPanelHeight(panelRef.current.scrollHeight)
    }
  }, [account.escalations, isExpanded])

  return (
    <div
      className={isExpanded ? '' : 'card-lift'}
      style={{
        backgroundColor: 'white',
        borderRadius: 12,
        border: isExpanded ? '1.5px solid #7308E3' : `1px solid ${isBlocked && isHighPriority ? '#FCA5A5' : '#EDE8FD'}`,
        borderLeft: isBlocked && isHighPriority
          ? '3px solid #E53030'
          : isExpanded
          ? '1.5px solid #7308E3'
          : '1px solid #EDE8FD',
        overflow: 'hidden',
        transition: 'border-color 150ms, box-shadow 200ms',
        boxShadow: isExpanded
          ? '0 0 0 3px rgba(115,8,227,0.10), 0 4px 20px rgba(115,8,227,0.08)'
          : '0 1px 4px rgba(115,8,227,0.06)',
      }}
    >
      {/* Main card header */}
      <div
        className="cursor-pointer"
        style={{ padding: '16px 20px' }}
        onClick={() => onToggle(account.name)}
      >
        {/* Row 1: Account name + meta */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 flex-1">
            {/* Chevron */}
            <svg
              width="12" height="12" viewBox="0 0 12 12" fill="none"
              style={{
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 200ms',
                color: '#9E94BC',
                flexShrink: 0,
              }}
            >
              <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            <span style={{ fontWeight: 600, fontSize: 14, color: '#1A0A2B', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.1px' }}>
              {account.name}
            </span>

            {account.escalations.length > 1 && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#7308E3',
                  backgroundColor: '#EDE8FD',
                  border: '1px solid #D9D0F8',
                  borderRadius: 20,
                  padding: '1px 8px',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {account.escalations.length} escalations
              </span>
            )}

            {/* Risk flags */}
            {account.riskFlags.includes('churn') && (
              <span style={{ fontSize: 10, fontWeight: 600, color: '#E53030', backgroundColor: '#FDEAEA', border: '1px solid #FCA5A5', borderRadius: 20, padding: '1px 8px', fontFamily: 'Inter, sans-serif' }}>
                Churn risk
              </span>
            )}
            {account.riskFlags.includes('legal') && (
              <span style={{ fontSize: 10, fontWeight: 600, color: '#E53030', backgroundColor: '#FDEAEA', border: '1px solid #FCA5A5', borderRadius: 20, padding: '1px 8px', fontFamily: 'Inter, sans-serif' }}>
                Legal
              </span>
            )}
            {account.riskFlags.includes('social') && (
              <span style={{ fontSize: 10, fontWeight: 600, color: '#D97706', backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 20, padding: '1px 8px', fontFamily: 'Inter, sans-serif' }}>
                Social
              </span>
            )}
          </div>

          {/* Risk score */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: '#9E94BC', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 1 }}>
                Risk score
              </div>
              <div style={{ fontWeight: 800, fontSize: 28, color: pColors.text, fontFamily: 'Inter, sans-serif', lineHeight: 1, letterSpacing: '-1px' }}>
                {account.topScore}
              </div>
            </div>
            <span
              className={isHighPriority ? 'pulse-badge' : ''}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: pColors.text,
                backgroundColor: pColors.bg,
                border: `1px solid ${pColors.border}`,
                borderRadius: 20,
                padding: '3px 10px',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {account.topPriority}
            </span>
          </div>
        </div>

        {/* Row 2: AI Summary */}
        {account.aiSummary && (
          <div
            style={{
              marginTop: 10,
              marginLeft: 20,
              fontWeight: 400,
              fontSize: 12,
              color: '#6B5E8B',
              lineHeight: 1.6,
              fontFamily: 'Inter, sans-serif',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {account.aiSummary}
          </div>
        )}

        {/* Row 3: Tags + Actions */}
        <div
          className="flex justify-between items-center flex-wrap gap-2 mt-3 pt-3"
          style={{ borderTop: '1px solid #EDE8FD' }}
        >
          <div className="flex gap-1.5 flex-wrap">
            <Pill label={account.topChannel} colors={cColors} />
            <Pill label={account.topStatus} colors={sColors} />
            <Pill label={topEsc?.account_tier || ''} colors={{ text: '#6B5E8B', bg: '#F6F3FF', border: '#EDE8FD' }} />
            {topEsc?.priority_hint && (
              <Pill label={topEsc.priority_hint} colors={{ text: '#6B5E8B', bg: '#F6F3FF', border: '#EDE8FD' }} />
            )}
          </div>

          <div className="flex items-center gap-3">
            <span
              style={{
                fontWeight: 400,
                fontSize: 12,
                color: topEsc?.owner === '—' ? '#E53030' : '#6B5E8B',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {topEsc?.owner === '—' ? 'Unassigned' : topEsc?.owner}
            </span>
            <span
              style={{
                fontWeight: 700,
                fontSize: 12,
                color: ageDays > 2 ? '#E53030' : '#059669',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {ageDays}d
            </span>
            {topEsc && (
              <button
                onClick={e => { e.stopPropagation(); onDraft(topEsc) }}
                style={{
                  fontWeight: 600,
                  fontSize: 12,
                  padding: '6px 14px',
                  border: '1.5px solid #7308E3',
                  color: '#7308E3',
                  borderRadius: 8,
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'all 150ms',
                }}
                onMouseEnter={e => {
                  ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = '#7308E3'
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'white'
                  ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(115,8,227,0.3)'
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#7308E3'
                  ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
                }}
              >
                Draft reply
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Drilldown panel */}
      <div
        ref={panelRef}
        style={{
          maxHeight: isExpanded ? `${Math.max(panelHeight, 200)}px` : 0,
          overflow: 'hidden',
          transition: 'max-height 250ms ease-in-out',
          backgroundColor: '#FDFCFF',
          borderTop: isExpanded ? '1px solid #EDE8FD' : 'none',
        }}
      >
        <div className="flex justify-between items-center px-5 py-3">
          <span
            style={{
              fontWeight: 600,
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#9E94BC',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            All escalations · {account.name}
          </span>
          <span style={{ fontSize: 11, color: '#9E94BC', fontFamily: 'Inter, sans-serif' }}>
            {account.escalations.length} total
          </span>
        </div>

        {account.escalations.map(esc => (
          <EscalationItem key={esc.id} esc={esc} onDraft={onDraft} />
        ))}
      </div>
    </div>
  )
}
