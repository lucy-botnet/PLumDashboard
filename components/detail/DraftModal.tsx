'use client'

import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { generateDraftReply } from '@/lib/draft'
import type { EscalationRow } from '@/types'

interface Props {
  escalation: EscalationRow | null
  isOpen: boolean
  onClose: () => void
}

const CHANNEL_COLORS = {
  WhatsApp: { text: '#059669', bg: '#D1FAE5', border: '#6EE7B7' },
  Slack: { text: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE' },
  Email: { text: '#7C3AED', bg: '#EDE9FE', border: '#C4B5FD' },
}

export default function DraftModal({ escalation, isOpen, onClose }: Props) {
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && escalation) {
      setDraft('')
      setError('')
      setLoading(true)
      generateDraftReply(escalation)
        .then(text => {
          setDraft(text)
          setLoading(false)
        })
        .catch(() => {
          setError('Failed to generate — try again')
          setLoading(false)
        })
    }
  }, [isOpen, escalation?.escalation_id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen || !escalation) return null

  const wordCount = draft.trim().split(/\s+/).filter(Boolean).length
  const channelColors = CHANNEL_COLORS[escalation.channel] || CHANNEL_COLORS.Email

  const handleRefine = async () => {
    setLoading(true)
    setError('')
    try {
      const refined = await generateDraftReply(escalation, 'Make more concise and empathetic.')
      setDraft(refined)
    } catch {
      setError('Failed to refine — try again')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = () => {
    toast.success('Reply queued for sending', {
      duration: 3000,
      position: 'bottom-center',
      style: {
        background: '#059669',
        color: 'white',
        fontFamily: 'Inter, sans-serif',
        fontSize: 13,
        fontWeight: 500,
        borderRadius: 8,
      },
    })
    onClose()
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
      onClick={e => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div
        className="bg-white rounded-xl border mx-4 w-full"
        style={{
          maxWidth: 576,
          border: '1px solid #E5E7EB',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: 24 }}>
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <div style={{ fontWeight: 600, fontSize: 16, color: '#111827', fontFamily: 'Inter, sans-serif' }}>
                Draft reply
              </div>
              <div style={{ fontWeight: 400, fontSize: 11, color: '#6B7280', marginTop: 4, fontFamily: 'Inter, sans-serif' }}>
                {escalation.escalation_id} · {escalation.account_tier} · {escalation.priority_hint || 'general'}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 20,
                color: '#9CA3AF',
                lineHeight: 1,
                padding: 4,
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#6B7280')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#9CA3AF')}
            >
              ×
            </button>
          </div>

          {/* Channel badge */}
          <div className="mb-4">
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: channelColors.text,
                backgroundColor: channelColors.bg,
                border: `0.5px solid ${channelColors.border}`,
                borderRadius: 20,
                padding: '3px 10px',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {escalation.channel}
            </span>
          </div>

          {/* Textarea */}
          <div style={{ position: 'relative' }}>
            <textarea
              value={loading ? '' : draft}
              onChange={e => setDraft(e.target.value)}
              disabled={loading}
              placeholder={loading ? 'Generating draft...' : 'Draft will appear here...'}
              style={{
                width: '100%',
                minHeight: 144,
                fontWeight: 400,
                fontSize: 13,
                lineHeight: 1.75,
                color: '#111827',
                backgroundColor: '#F9FAFB',
                border: error ? '1px solid #DC2626' : '1px solid #E5E7EB',
                borderRadius: 8,
                padding: 12,
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'Inter, sans-serif',
                opacity: loading ? 0.6 : 1,
                boxSizing: 'border-box',
              }}
            />
            {loading && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ borderRadius: 8 }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    border: '2px solid #E5E7EB',
                    borderTop: '2px solid #4F46E5',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
              </div>
            )}
          </div>

          {error && (
            <div style={{ fontSize: 12, color: '#DC2626', marginTop: 6, fontFamily: 'Inter, sans-serif' }}>
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center mt-4 flex-wrap gap-2">
            <span style={{ fontWeight: 400, fontSize: 11, color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>
              {wordCount} words
            </span>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 400,
                  fontSize: 12,
                  color: '#6B7280',
                  fontFamily: 'Inter, sans-serif',
                  padding: '6px 12px',
                }}
              >
                Discard
              </button>
              <button
                onClick={handleRefine}
                disabled={loading}
                style={{
                  fontWeight: 500,
                  fontSize: 12,
                  padding: '6px 12px',
                  border: '1px solid #4F46E5',
                  color: '#4F46E5',
                  borderRadius: 8,
                  backgroundColor: 'transparent',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                Refine with AI ↗
              </button>
              <button
                onClick={handleSend}
                disabled={loading || !draft}
                style={{
                  fontWeight: 500,
                  fontSize: 12,
                  padding: '6px 12px',
                  backgroundColor: '#4F46E5',
                  color: 'white',
                  borderRadius: 8,
                  border: 'none',
                  cursor: loading || !draft ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  opacity: loading || !draft ? 0.6 : 1,
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
