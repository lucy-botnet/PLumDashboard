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
  High:   { text: '#EF4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)' },
  Medium: { text: '#F59E0B', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)' },
  Low:    { text: '#10B981', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)' },
}

const STATUS_COLORS = {
  Blocked:       { text: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  Open:          { text: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  'In Progress': { text: '#4F46E5', bg: 'rgba(79,70,229,0.15)' },
  Closed:        { text: '#10B981', bg: 'rgba(16,185,129,0.12)' },
}

const CHANNEL_COLORS = {
  WhatsApp: { text: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
  Slack:    { text: '#4F46E5', bg: 'rgba(79,70,229,0.15)', border: 'rgba(79,70,229,0.3)' },
  Email:    { text: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)' },
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

function ResolutionBar({ ageHours, maxHours }: { ageHours: number; maxHours: number | null }) {
  if (!maxHours) return null
  const pct = Math.min((ageHours / maxHours) * 100, 100)
  const color = pct < 50 ? '#10B981' : pct < 80 ? '#F59E0B' : '#EF4444'
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: '#475569', fontFamily: 'Inter, sans-serif' }}>Resolution</span>
        <span style={{ fontSize: 10, color: '#475569', fontFamily: 'Inter, sans-serif' }}>
          {Math.round(ageHours)}h of max {maxHours}h
        </span>
      </div>
      <div style={{ height: 6, backgroundColor: '#2D3561', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 3, transition: 'width 400ms' }} />
      </div>
    </div>
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
      style={{ borderBottomColor: '#2D3561' }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(30,41,82,0.5)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
    >
      {/* Row: ID / subject / pills / score / draft */}
      <div className="flex items-center gap-3 px-5 pt-3 pb-1">
        <span style={{ fontWeight: 500, fontSize: 10, color: '#475569', width: 80, flexShrink: 0, fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em' }}>
          {esc.escalation_id}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500, fontSize: 12, color: '#F1F5F9', fontFamily: 'Inter, sans-serif', textTransform: 'capitalize' }}>
            {esc.subject || esc.priority_hint || 'general'}
          </div>
          <div className="flex gap-1 mt-1 flex-wrap">
            <Pill label={esc.channel} colors={cColors} />
            <Pill label={esc.current_status} colors={sColors} />
            {esc.root_cause && (
              <span style={{
                fontSize: 10, fontWeight: 500, color: '#3B82F6',
                backgroundColor: '#1E3A5F', border: '1px solid rgba(59,130,246,0.4)',
                borderRadius: 20, padding: '2px 8px', fontFamily: 'Inter, sans-serif',
              }}>
                {esc.root_cause}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span style={{ fontWeight: 700, fontSize: 13, color: pColors.text, fontFamily: 'Inter, sans-serif' }}>
            {esc.score}
          </span>
          <span style={{ fontWeight: 400, fontSize: 11, color: '#475569', fontFamily: 'Inter, sans-serif' }}>
            {ageDays}d
          </span>
          <button
            onClick={e => { e.stopPropagation(); onDraft(esc) }}
            style={{
              fontWeight: 600, fontSize: 11, padding: '4px 10px',
              border: '1.5px solid #4F46E5', color: '#4F46E5',
              borderRadius: 6, backgroundColor: 'transparent',
              cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 150ms',
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

      {/* Resolved by */}
      {esc.resolved_at && (
        <div style={{ marginLeft: 100, marginRight: 16, marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
            Resolved by: {esc.resolved_by || 'Unknown'} {esc.employee_id ? `(${esc.employee_id})` : ''}
          </span>
        </div>
      )}
      {!esc.resolved_at && esc.current_status !== 'Closed' && (
        <div style={{ marginLeft: 100, marginRight: 16, marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: '#EF4444', fontFamily: 'Inter, sans-serif' }}>Unresolved</span>
        </div>
      )}

      {/* Message summary */}
      {summaryPreview && (
        <div style={{ marginLeft: 100, marginRight: 16, marginBottom: 10, padding: '6px 12px', backgroundColor: 'rgba(15,17,40,0.6)', borderRadius: 6, borderLeft: '2px solid #2D3561' }}>
          <span style={{ fontSize: 11, fontWeight: 400, color: '#94A3B8', fontFamily: 'Inter, sans-serif', lineHeight: 1.55 }}>
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
  const b2bOrB2c = topEsc?.b2b_or_b2c

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
        backgroundColor: '#1A1F3A',
        borderRadius: 12,
        border: isExpanded
          ? '1.5px solid #4F46E5'
          : `1px solid ${isBlocked && isHighPriority ? 'rgba(239,68,68,0.5)' : '#2D3561'}`,
        borderLeft: isBlocked && isHighPriority
          ? '3px solid #EF4444'
          : isExpanded
          ? '1.5px solid #4F46E5'
          : '1px solid #2D3561',
        overflow: 'hidden',
        transition: 'border-color 150ms, box-shadow 200ms',
        boxShadow: isExpanded
          ? '0 0 0 3px rgba(79,70,229,0.15), 0 4px 20px rgba(0,0,0,0.3)'
          : '0 1px 4px rgba(0,0,0,0.3)',
      }}
    >
      {/* Main card header */}
      <div className="cursor-pointer" style={{ padding: '12px 16px' }} onClick={() => onToggle(account.name)}>
        {/* Row 1: Account name + meta */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 flex-1" style={{ minWidth: 0 }}>
            {/* Chevron */}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
              style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 200ms', color: '#475569', flexShrink: 0 }}>
              <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            <span style={{ fontWeight: 600, fontSize: 14, color: '#F1F5F9', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {account.name}
            </span>

            {account.escalations.length > 1 && (
              <span style={{ fontSize: 10, fontWeight: 600, color: '#4F46E5', backgroundColor: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.3)', borderRadius: 20, padding: '1px 8px', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>
                {account.escalations.length} escalations
              </span>
            )}

            {/* Risk flags */}
            {account.riskFlags.includes('churn') && (
              <span style={{ fontSize: 10, fontWeight: 600, color: '#EF4444', backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, padding: '1px 8px', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>Churn risk</span>
            )}
            {account.riskFlags.includes('legal') && (
              <span style={{ fontSize: 10, fontWeight: 600, color: '#EF4444', backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, padding: '1px 8px', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>Legal</span>
            )}
            {account.riskFlags.includes('social') && (
              <span style={{ fontSize: 10, fontWeight: 600, color: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20, padding: '1px 8px', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>Social</span>
            )}
          </div>

          {/* Risk score + B2B badge + Priority */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0, marginLeft: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: '#475569', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 1 }}>Risk score</div>
              <div style={{ fontWeight: 800, fontSize: 28, color: pColors.text, fontFamily: 'Inter, sans-serif', lineHeight: 1, letterSpacing: '-1px' }}>{account.topScore}</div>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {b2bOrB2c && (
                <span style={{
                  fontSize: 10, fontWeight: 500, borderRadius: 20, padding: '3px 8px', fontFamily: 'Inter, sans-serif',
                  color: b2bOrB2c === 'B2B' ? '#3B82F6' : '#D946EF',
                  backgroundColor: b2bOrB2c === 'B2B' ? '#1E3A5F' : '#2D1B4E',
                  border: `1px solid ${b2bOrB2c === 'B2B' ? 'rgba(59,130,246,0.4)' : 'rgba(217,70,239,0.4)'}`,
                }}>
                  {b2bOrB2c}
                </span>
              )}
              <span
                className={isHighPriority ? 'pulse-badge' : ''}
                style={{ fontSize: 11, fontWeight: 600, color: pColors.text, backgroundColor: pColors.bg, border: `1px solid ${pColors.border}`, borderRadius: 20, padding: '3px 10px', fontFamily: 'Inter, sans-serif' }}
              >
                {account.topPriority}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: AI Summary */}
        {account.aiSummary && (
          <div style={{ marginTop: 8, marginLeft: 20, fontWeight: 400, fontSize: 12, color: '#94A3B8', lineHeight: 1.6, fontFamily: 'Inter, sans-serif', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {account.aiSummary}
          </div>
        )}

        {/* Row 3: Tags + Actions */}
        <div className="flex justify-between items-center flex-wrap gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #2D3561' }}>
          <div className="flex gap-1.5 flex-wrap">
            <Pill label={account.topChannel} colors={cColors} />
            <Pill label={account.topStatus} colors={sColors} />
            <Pill label={topEsc?.account_tier || ''} colors={{ text: '#94A3B8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' }} />
            {topEsc?.priority_hint && (
              <Pill label={topEsc.priority_hint} colors={{ text: '#94A3B8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.15)' }} />
            )}
            {topEsc?.root_cause && (
              <span style={{ fontSize: 10, fontWeight: 500, color: '#3B82F6', backgroundColor: '#1E3A5F', border: '1px solid rgba(59,130,246,0.4)', borderRadius: 20, padding: '2px 8px', fontFamily: 'Inter, sans-serif' }}>
                {topEsc.root_cause}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span style={{ fontWeight: 400, fontSize: 12, color: topEsc?.owner === '—' ? '#EF4444' : '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
              {topEsc?.owner === '—' ? 'Unassigned' : topEsc?.owner}
            </span>
            <span style={{ fontWeight: 700, fontSize: 12, color: ageDays > 2 ? '#EF4444' : '#10B981', fontFamily: 'Inter, sans-serif' }}>
              {ageDays}d
            </span>
            {topEsc && (
              <button
                onClick={e => { e.stopPropagation(); onDraft(topEsc) }}
                style={{
                  fontWeight: 600, fontSize: 12, padding: '6px 14px',
                  border: '1.5px solid #4F46E5', color: '#4F46E5',
                  borderRadius: 8, backgroundColor: 'transparent',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 150ms',
                }}
                onMouseEnter={e => {
                  ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4F46E5'
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'white'
                  ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(79,70,229,0.3)'
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#4F46E5'
                  ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
                }}
              >
                Draft reply
              </button>
            )}
          </div>
        </div>

        {/* Resolution bar */}
        {topEsc && (
          <ResolutionBar ageHours={topEsc.age_hours || 0} maxHours={topEsc.max_resolution_hours || null} />
        )}
      </div>

      {/* Drilldown panel */}
      <div
        ref={panelRef}
        style={{
          maxHeight: isExpanded ? `${Math.max(panelHeight, 200)}px` : 0,
          overflow: 'hidden',
          transition: 'max-height 250ms ease-in-out',
          backgroundColor: 'rgba(15,17,40,0.5)',
          borderTop: isExpanded ? '1px solid #2D3561' : 'none',
        }}
      >
        <div className="flex justify-between items-center px-5 py-3">
          <span style={{ fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569', fontFamily: 'Inter, sans-serif' }}>
            All escalations · {account.name}
          </span>
          <span style={{ fontSize: 11, color: '#475569', fontFamily: 'Inter, sans-serif' }}>{account.escalations.length} total</span>
        </div>
        {account.escalations.map(esc => (
          <EscalationItem key={esc.id} esc={esc} onDraft={onDraft} />
        ))}
      </div>
    </div>
  )
}
