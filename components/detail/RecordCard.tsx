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
  High: { text: '#DC2626', bg: '#FCEBEB', border: '#F09595' },
  Medium: { text: '#D97706', bg: '#FEF3C7', border: '#FCD34D' },
  Low: { text: '#059669', bg: '#D1FAE5', border: '#6EE7B7' },
}

const STATUS_COLORS = {
  Blocked: { text: '#DC2626', bg: '#FCEBEB' },
  Open: { text: '#D97706', bg: '#FEF3C7' },
  'In Progress': { text: '#4F46E5', bg: '#EEF2FF' },
  Closed: { text: '#059669', bg: '#D1FAE5' },
}

const CHANNEL_COLORS = {
  WhatsApp: { text: '#059669', bg: '#D1FAE5', border: '#6EE7B7' },
  Slack: { text: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE' },
  Email: { text: '#7C3AED', bg: '#EDE9FE', border: '#C4B5FD' },
}

function Pill({ label, colors }: { label: string; colors: { text: string; bg: string; border?: string } }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 500,
        fontFamily: 'Inter, sans-serif',
        color: colors.text,
        backgroundColor: colors.bg,
        border: `0.5px solid ${colors.border || colors.bg}`,
        borderRadius: 20,
        padding: '2px 8px',
      }}
    >
      {label}
    </span>
  )
}

function EscalationRow({ esc, onDraft }: { esc: EscalationRow; onDraft: (e: EscalationRow) => void }) {
  const pColors = PRIORITY_COLORS[esc.priority_bucket] || PRIORITY_COLORS.Low
  const sColors = STATUS_COLORS[esc.current_status] || STATUS_COLORS.Open
  const cColors = CHANNEL_COLORS[esc.channel] || CHANNEL_COLORS.Email
  const ageDays = Math.round((esc.age_hours || 0) / 24)

  // Build message summary: prefer ai_summary, fall back to message text (truncated)
  const summary = esc.ai_summary
    ? esc.ai_summary
    : esc.message
    ? esc.message.replace(/\s+/g, ' ').trim()
    : null
  const summaryPreview = summary ? (summary.length > 130 ? summary.slice(0, 130) + '…' : summary) : null

  return (
    <div
      className="border-b last:border-b-0 transition-colors"
      style={{ borderBottomColor: '#E5E7EB' }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'white')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
    >
      {/* Top row: ID / pills / score / draft */}
      <div className="flex items-center gap-3 px-5 pt-2.5 pb-1">
        <span style={{ fontWeight: 500, fontSize: 11, color: '#9CA3AF', width: 80, flexShrink: 0, fontFamily: 'Inter, sans-serif' }}>
          {esc.escalation_id}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500, fontSize: 12, color: '#111827', fontFamily: 'Inter, sans-serif', textTransform: 'capitalize' }}>
            {esc.subject || esc.priority_hint || 'general'}
          </div>
          <div className="flex gap-1 mt-0.5">
            <Pill label={esc.channel} colors={cColors} />
            <Pill label={esc.current_status} colors={sColors} />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span style={{ fontWeight: 600, fontSize: 12, color: pColors.text, fontFamily: 'Inter, sans-serif' }}>
            {esc.score}
          </span>
          <span style={{ fontWeight: 400, fontSize: 11, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>
            {ageDays}d
          </span>
          <button
            onClick={e => { e.stopPropagation(); onDraft(esc) }}
            style={{
              fontWeight: 500,
              fontSize: 11,
              padding: '4px 10px',
              border: '1px solid #4F46E5',
              color: '#4F46E5',
              borderRadius: 6,
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 150ms',
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
            marginBottom: 8,
            padding: '6px 10px',
            backgroundColor: '#F9FAFB',
            borderRadius: 6,
            borderLeft: '2px solid #E5E7EB',
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 400, color: '#6B7280', fontFamily: 'Inter, sans-serif', lineHeight: 1.55 }}>
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
        borderRadius: isBlocked && isHighPriority ? '0 12px 12px 0' : 12,
        border: isExpanded ? '1px solid #4F46E5' : '1px solid #E5E7EB',
        borderLeft: isBlocked && isHighPriority ? '3px solid #DC2626' : (isExpanded ? '1px solid #4F46E5' : '1px solid #E5E7EB'),
        overflow: 'hidden',
        transition: 'border-color 150ms, box-shadow 200ms',
        boxShadow: isExpanded ? '0 0 0 2px rgba(79,70,229,0.12)' : '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      {/* Main card section */}
      <div
        className="cursor-pointer"
        style={{ padding: '16px 20px' }}
        onClick={() => onToggle(account.name)}
      >
        {/* Row 1: Account header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 flex-1">
            {/* Chevron */}
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              style={{
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 200ms',
                color: '#6B7280',
                flexShrink: 0,
              }}
            >
              <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            <span style={{ fontWeight: 500, fontSize: 14, color: '#111827', fontFamily: 'Inter, sans-serif' }}>
              {account.name}
            </span>

            {account.escalations.length > 1 && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: '#6B7280',
                  backgroundColor: '#F3F4F6',
                  border: '1px solid #E5E7EB',
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
              <span style={{ fontSize: 10, fontWeight: 500, color: '#DC2626', backgroundColor: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: 20, padding: '1px 8px', fontFamily: 'Inter, sans-serif' }}>
                Churn risk
              </span>
            )}
            {account.riskFlags.includes('legal') && (
              <span style={{ fontSize: 10, fontWeight: 500, color: '#DC2626', backgroundColor: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: 20, padding: '1px 8px', fontFamily: 'Inter, sans-serif' }}>
                Legal
              </span>
            )}
            {account.riskFlags.includes('social') && (
              <span style={{ fontSize: 10, fontWeight: 500, color: '#D97706', backgroundColor: '#FAEEDA', border: '0.5px solid #FAC775', borderRadius: 20, padding: '1px 8px', fontFamily: 'Inter, sans-serif' }}>
                Social
              </span>
            )}
          </div>

          <div className="flex flex-col items-end gap-1">
            <span style={{ fontWeight: 600, fontSize: 24, color: pColors.text, fontFamily: 'Inter, sans-serif' }}>
              {account.topScore}
            </span>
            <span
              className={isHighPriority ? 'pulse-badge' : ''}
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: pColors.text,
                backgroundColor: pColors.bg,
                border: `0.5px solid ${pColors.border}`,
                borderRadius: 20,
                padding: '4px 10px',
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
              marginTop: 8,
              marginLeft: 20,
              fontWeight: 400,
              fontSize: 12,
              color: '#6B7280',
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

        {/* Row 3: Metadata + Actions */}
        <div
          className="flex justify-between items-center flex-wrap gap-2 mt-3 pt-3"
          style={{ borderTop: '1px solid #E5E7EB' }}
        >
          {/* Tags */}
          <div className="flex gap-1.5 flex-wrap">
            <Pill label={account.topChannel} colors={cColors} />
            <Pill label={account.topStatus} colors={sColors} />
            <Pill label={topEsc?.account_tier || ''} colors={{ text: '#6B7280', bg: '#F3F4F6' }} />
            {topEsc?.priority_hint && (
              <Pill label={topEsc.priority_hint} colors={{ text: '#6B7280', bg: '#F3F4F6' }} />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <span
              style={{
                fontWeight: 400,
                fontSize: 12,
                color: topEsc?.owner === '—' ? '#DC2626' : '#6B7280',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {topEsc?.owner === '—' ? 'Unassigned' : topEsc?.owner}
            </span>
            <span
              style={{
                fontWeight: 600,
                fontSize: 12,
                color: ageDays > 2 ? '#DC2626' : '#059669',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {ageDays}d
            </span>
            {topEsc && (
              <button
                onClick={e => { e.stopPropagation(); onDraft(topEsc) }}
                style={{
                  fontWeight: 500,
                  fontSize: 12,
                  padding: '6px 12px',
                  border: '1px solid #4F46E5',
                  color: '#4F46E5',
                  borderRadius: 8,
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'all 150ms',
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
                Draft reply
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Drilldown Panel */}
      <div
        ref={panelRef}
        style={{
          maxHeight: isExpanded ? `${Math.max(panelHeight, 200)}px` : 0,
          overflow: 'hidden',
          transition: 'max-height 250ms ease-in-out',
          backgroundColor: '#F9FAFB',
          borderTop: isExpanded ? '1px solid #E5E7EB' : 'none',
        }}
      >
        <div className="flex justify-between items-center px-5 py-3">
          <span
            style={{
              fontWeight: 500,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#6B7280',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            All escalations from {account.name}
          </span>
          <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>
            {account.escalations.length} total
          </span>
        </div>

        {account.escalations.map(esc => (
          <EscalationRow key={esc.id} esc={esc} onDraft={onDraft} />
        ))}
      </div>
    </div>
  )
}
