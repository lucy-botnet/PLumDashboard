'use client'

import { useState, useEffect, useRef } from 'react'
import Script from 'next/script'
import { createClient } from '@supabase/supabase-js'
import TopNav from '@/components/nav/TopNav'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly'

// Escalation keywords to search for in Gmail
const SEARCH_QUERY =
  'subject:(escalation OR urgent OR critical OR blocked OR IRDAI OR "no response" OR "stuck" OR "asap" OR "delayed") newer_than:14d'

interface ParsedEmail {
  messageId: string
  subject: string
  from: string
  accountName: string
  body: string
  date: string
  channel: 'Email'
}

interface ScoredRow {
  escalation_id: string
  account_name: string
  account_tier: string
  channel: string
  sender_name: string
  subject: string
  message: string
  priority_hint: string
  sla_hours: number
  current_status: string
  owner: string
  age_hours: number
  ai_action: string
  ai_summary: string
  score: number
  priority_bucket: string
  risk_flags: string[]
  dim_business: number
  dim_time_age: number
  dim_comms: number
  dim_complexity: number
  dim_risk: number
  dim_ownership: number
  dim_historical: number
}

// ── Scoring (same logic as seed page) ──────────────────────────────────────
function detectHint(text: string): string {
  const t = text.toLowerCase()
  if (/\bescalation\b/.test(t)) return 'escalation'
  if (/\bcritical\b/.test(t)) return 'critical'
  if (/no.?response/.test(t)) return 'no response'
  if (/\burgent\b/.test(t)) return 'urgent'
  if (/\basap\b/.test(t)) return 'asap'
  if (/\bstuck\b/.test(t)) return 'stuck'
  if (/\bdelay/.test(t)) return 'delay'
  if (/\bblocked\b/.test(t)) return 'blocked'
  return 'general'
}

function scoreRow(row: {
  message: string; priority_hint: string; account_tier: string
  channel: string; current_status: string; age_hours: number; sla_hours: number
}) {
  const msg = (row.message + ' ' + row.priority_hint).toLowerCase()
  const tier = row.account_tier
  const channel = row.channel
  const status = row.current_status

  let dimBusiness = tier === 'Enterprise' ? 20 : tier === 'Mid-Market' ? 12 : 5
  if (/renewal|premium|gmc|gpa|policy value/.test(msg)) dimBusiness = Math.min(dimBusiness + 5, 25)

  const ratio = row.age_hours / (row.sla_hours || 24)
  let dimTimeAge = ratio >= 3 ? 20 : ratio >= 2 ? 15 : ratio >= 1 ? 10 : ratio >= 0.5 ? 5 : 0

  const dimComms = channel === 'WhatsApp' ? 15 : channel === 'Slack' ? 10 : 7

  let dimComplexity =
    /escalation/.test(msg) ? 15 : /critical/.test(msg) ? 14 : /no response/.test(msg) ? 12
    : /urgent/.test(msg) ? 11 : /asap/.test(msg) ? 10 : /stuck|blocked/.test(msg) ? 8
    : /delay/.test(msg) ? 6 : 3
  if (/claim|onboarding|medical|cashless|health id/.test(msg)) dimComplexity = Math.min(dimComplexity + 3, 18)

  let dimRisk = 0
  const riskFlags: string[] = []
  if (/irdai|legal|regulatory|not renewing|cancel|publicly/.test(msg)) {
    dimRisk = 15
    if (/not renewing|cancel/.test(msg)) riskFlags.push('churn')
    if (/irdai|legal|regulatory/.test(msg)) riskFlags.push('legal')
    if (/publicly/.test(msg)) riskFlags.push('social')
  } else if (/unhappy|escalate|disappointed|frustrated/.test(msg)) {
    dimRisk = 10; riskFlags.push('churn')
  } else if (/urgent|asap|critical/.test(msg)) dimRisk = 5
  dimRisk = Math.min(dimRisk, 15)

  const dimOwnership = status === 'Blocked' ? 10 : status === 'Open' ? 8 : status === 'In Progress' ? 4 : 0
  const dimHistorical = /no response/.test(msg) ? 5 : /escalation|critical/.test(msg) ? 3 : 1

  const score = Math.min(
    dimBusiness + dimTimeAge + dimComms + dimComplexity + dimRisk + dimOwnership + dimHistorical, 100
  )
  const priority_bucket = score >= 70 ? 'High' : score >= 45 ? 'Medium' : 'Low'

  return { score, priority_bucket, risk_flags: riskFlags, dim_business: dimBusiness, dim_time_age: dimTimeAge, dim_comms: dimComms, dim_complexity: dimComplexity, dim_risk: dimRisk, dim_ownership: dimOwnership, dim_historical: dimHistorical }
}

function guessAccountName(from: string): string {
  // Try to get company from email domain: "John Doe <john@acmecorp.com>" → "Acmecorp"
  const emailMatch = from.match(/@([\w.-]+)/)
  if (emailMatch) {
    const domain = emailMatch[1].split('.')[0]
    const skip = ['gmail', 'yahoo', 'hotmail', 'outlook', 'icloud', 'protonmail']
    if (!skip.includes(domain.toLowerCase())) {
      return domain.charAt(0).toUpperCase() + domain.slice(1)
    }
  }
  // Fall back to display name
  const nameMatch = from.match(/^"?([^"<]+)"?\s*</)
  if (nameMatch) return nameMatch[1].trim()
  return from.split('@')[0] || 'Unknown'
}

function decodeBase64(str: string): string {
  try {
    return decodeURIComponent(
      atob(str.replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
  } catch {
    return ''
  }
}

function extractBody(payload: { mimeType?: string; body?: { data?: string }; parts?: unknown[] }): string {
  if (!payload) return ''
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decodeBase64(payload.body.data)
  }
  if (payload.parts) {
    for (const part of payload.parts as typeof payload[]) {
      const text = extractBody(part)
      if (text) return text
    }
  }
  return ''
}

function parseEmail(msg: {
  id: string
  payload: {
    headers: { name: string; value: string }[]
    mimeType?: string
    body?: { data?: string }
    parts?: unknown[]
  }
  internalDate?: string
}): ParsedEmail {
  const headers = msg.payload?.headers || []
  const get = (name: string) => headers.find((h: { name: string }) => h.name.toLowerCase() === name.toLowerCase())?.value || ''
  const subject = get('Subject')
  const from = get('From')
  const dateMs = msg.internalDate ? parseInt(msg.internalDate) : Date.now()
  const body = extractBody(msg.payload).slice(0, 800)

  return {
    messageId: msg.id,
    subject,
    from,
    accountName: guessAccountName(from),
    body,
    date: new Date(dateMs).toISOString(),
    channel: 'Email',
  }
}

function emailToRow(email: ParsedEmail): ScoredRow {
  const hint = detectHint(email.subject + ' ' + email.body)
  const ageHours = Math.round((Date.now() - new Date(email.date).getTime()) / 3_600_000)
  const slaHours = 8 // default SLA for email

  const base = {
    escalation_id: `GMAIL_${email.messageId.slice(-10).toUpperCase()}`,
    account_name: email.accountName,
    account_tier: 'Mid-Market', // default; can be enriched
    channel: 'Email',
    sender_name: email.from.replace(/<.*>/, '').trim() || email.from,
    subject: email.subject,
    message: email.body,
    priority_hint: hint,
    sla_hours: slaHours,
    current_status: 'Open',
    owner: '—',
    age_hours: ageHours,
    ai_action: 'Follow up',
    ai_summary: `Email escalation from ${email.accountName}: ${email.subject.slice(0, 100)}`,
  }

  const scored = scoreRow({ ...base })
  return { ...base, ...scored }
}

// ── Component ───────────────────────────────────────────────────────────────
type SyncStatus = 'idle' | 'auth' | 'fetching' | 'preview' | 'importing' | 'done' | 'error'

export default function GmailSyncPage() {
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [log, setLog] = useState<string[]>([])
  const [preview, setPreview] = useState<ScoredRow[]>([])
  const [importedCount, setImportedCount] = useState(0)
  const [error, setError] = useState('')
  const tokenRef = useRef<string>('')
  const tokenClientRef = useRef<{ requestAccessToken: () => void } | null>(null)

  const addLog = (msg: string) => setLog(prev => [...prev, msg])

  const missingClientId = !GOOGLE_CLIENT_ID

  // Initialize Google token client once GIS is loaded
  const initTokenClient = () => {
    if (typeof window === 'undefined' || !('google' in window)) return
    tokenClientRef.current = (window as unknown as {
      google: {
        accounts: {
          oauth2: {
            initTokenClient: (config: {
              client_id: string; scope: string
              callback: (resp: { access_token?: string; error?: string }) => void
            }) => { requestAccessToken: () => void }
          }
        }
      }
    }).google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GMAIL_SCOPE,
      callback: async (resp) => {
        if (resp.error || !resp.access_token) {
          setError('Google auth failed: ' + (resp.error || 'no token'))
          setStatus('error')
          return
        }
        tokenRef.current = resp.access_token
        await fetchEmails(resp.access_token)
      },
    })
  }

  async function fetchEmails(token: string) {
    setStatus('fetching')
    addLog('Searching Gmail for escalation-related emails...')
    try {
      const listRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=${encodeURIComponent(SEARCH_QUERY)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const listData = await listRes.json()
      const messages: { id: string }[] = listData.messages || []

      if (messages.length === 0) {
        addLog('No matching emails found.')
        setStatus('idle')
        return
      }
      addLog(`Found ${messages.length} emails. Fetching details...`)

      const rows: ScoredRow[] = []
      for (const m of messages.slice(0, 40)) {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        const msgData = await msgRes.json()
        try {
          const parsed = parseEmail(msgData)
          rows.push(emailToRow(parsed))
        } catch {
          // skip unparseable messages
        }
      }

      addLog(`Parsed ${rows.length} escalation rows. Review below and confirm import.`)
      setPreview(rows)
      setStatus('preview')
    } catch (err) {
      setError(String(err))
      setStatus('error')
    }
  }

  async function importRows() {
    setStatus('importing')
    addLog('Importing into Supabase...')

    // Check existing IDs to avoid duplicates
    const { data: existing } = await supabase.from('escalations').select('escalation_id')
    const existingIds = new Set((existing || []).map(r => r.escalation_id))
    const newRows = preview.filter(r => !existingIds.has(r.escalation_id))

    if (newRows.length === 0) {
      addLog('All rows already imported — nothing new to add.')
      setStatus('done')
      setImportedCount(0)
      return
    }

    let inserted = 0
    const BATCH = 20
    for (let i = 0; i < newRows.length; i += BATCH) {
      const batch = newRows.slice(i, i + BATCH)
      const { error: err } = await supabase.from('escalations').insert(batch)
      if (err) {
        addLog(`❌ Error: ${err.message}`)
      } else {
        inserted += batch.length
        addLog(`✓ Inserted ${inserted} / ${newRows.length}`)
      }
    }

    setImportedCount(inserted)
    addLog(`\n✅ Done! ${inserted} new escalations imported.`)
    setStatus('done')
  }

  const handleConnect = () => {
    if (!tokenClientRef.current) {
      setError('Google Identity Services not loaded yet. Please wait a moment and try again.')
      return
    }
    setStatus('auth')
    setLog([])
    setPreview([])
    setError('')
    tokenClientRef.current.requestAccessToken()
  }

  const PRIORITY_COLORS: Record<string, string> = {
    High: '#DC2626', Medium: '#D97706', Low: '#059669'
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initTokenClient}
      />
      <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
        <TopNav />

        <main className="px-6 py-6" style={{ maxWidth: 800, margin: '0 auto' }}>
          {/* Header card */}
          <div
            className="fade-in-up"
            style={{
              background: 'white', borderRadius: 16, border: '1px solid #E5E7EB',
              padding: 32, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              {/* Gmail icon */}
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="#FEEBE6"/>
                <path d="M6 10.5L16 17.5L26 10.5" stroke="#EA4335" strokeWidth="1.5" strokeLinejoin="round"/>
                <rect x="6" y="9" width="20" height="14" rx="2" stroke="#EA4335" strokeWidth="1.5"/>
              </svg>
              <div>
                <div style={{ fontWeight: 600, fontSize: 20, color: '#111827', fontFamily: 'Inter, sans-serif' }}>
                  Gmail Sync
                </div>
                <div style={{ fontSize: 13, color: '#6B7280', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>
                  Import real escalations from your Gmail inbox
                </div>
              </div>
            </div>

            {missingClientId ? (
              <div
                style={{
                  marginTop: 20, padding: '16px 20px', backgroundColor: '#FFFBEB',
                  border: '1px solid #FCD34D', borderRadius: 12,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13, color: '#92400E', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
                  Setup required — add your Google Client ID
                </div>
                <ol style={{ fontSize: 12, color: '#78350F', lineHeight: 2, paddingLeft: 20, fontFamily: 'Inter, sans-serif', margin: 0 }}>
                  <li>Go to <strong>console.cloud.google.com</strong> → Create a project</li>
                  <li>Enable <strong>Gmail API</strong> in &quot;APIs &amp; Services&quot;</li>
                  <li>Create <strong>OAuth 2.0 Client ID</strong> (Web application)</li>
                  <li>Add your site URL to <strong>Authorised JavaScript origins</strong></li>
                  <li>Add <code style={{ background: '#FEF3C7', padding: '1px 4px', borderRadius: 4 }}>NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id</code> to your <code>.env.local</code></li>
                  <li>Add the same secret in GitHub → Settings → Secrets → <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code></li>
                </ol>
              </div>
            ) : (
              <div style={{ marginTop: 20 }}>
                <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.8, margin: '0 0 20px', fontFamily: 'Inter, sans-serif' }}>
                  Searches your Gmail for emails containing keywords like <em>escalation, urgent, critical, blocked, IRDAI</em> from the last 14 days, scores them with the same algorithm as the dashboard, and imports them into Supabase — replacing dummy data with real escalations.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={handleConnect}
                    disabled={['auth', 'fetching', 'importing'].includes(status)}
                    style={{
                      fontWeight: 500, fontSize: 14, padding: '10px 22px',
                      background: 'linear-gradient(135deg, #EA4335 0%, #C5221F 100%)',
                      color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif', opacity: ['auth', 'fetching', 'importing'].includes(status) ? 0.6 : 1,
                      boxShadow: '0 2px 8px rgba(234,67,53,0.3)',
                      transition: 'all 150ms',
                    }}
                    onMouseEnter={e => {
                      if (!['auth', 'fetching', 'importing'].includes(status)) {
                        ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
                        ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(234,67,53,0.4)'
                      }
                    }}
                    onMouseLeave={e => {
                      ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
                      ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(234,67,53,0.3)'
                    }}
                  >
                    {status === 'auth' ? 'Waiting for Google auth...'
                      : status === 'fetching' ? 'Fetching emails...'
                      : status === 'importing' ? 'Importing...'
                      : status === 'done' ? 'Sync again'
                      : 'Connect Gmail & Sync'}
                  </button>
                  {status === 'done' && (
                    <a
                      href="/dashboard/detail"
                      style={{
                        fontWeight: 500, fontSize: 14, padding: '10px 22px',
                        background: '#4F46E5', color: 'white', textDecoration: 'none',
                        borderRadius: 10, fontFamily: 'Inter, sans-serif',
                        boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
                      }}
                    >
                      View in dashboard →
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Log output */}
          {log.length > 0 && (
            <div
              className="fade-in-up"
              style={{
                background: '#111827', borderRadius: 12, padding: 20,
                marginBottom: 24, maxHeight: 200, overflowY: 'auto',
              }}
            >
              {log.map((line, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 12, fontFamily: 'monospace', marginBottom: 4,
                    color: line.startsWith('❌') ? '#F87171'
                      : line.startsWith('✅') ? '#34D399'
                      : line.startsWith('✓') ? '#6EE7B7'
                      : '#D1D5DB',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              style={{
                background: '#FCEBEB', border: '1px solid #F09595', borderRadius: 10,
                padding: '12px 16px', marginBottom: 24, color: '#DC2626',
                fontSize: 13, fontFamily: 'Inter, sans-serif',
              }}
            >
              ⚠ {error}
            </div>
          )}

          {/* Preview table */}
          {status === 'preview' && preview.length > 0 && (
            <div
              className="fade-in-up"
              style={{
                background: 'white', borderRadius: 16, border: '1px solid #E5E7EB',
                overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              <div
                className="flex justify-between items-center px-6 py-4"
                style={{ borderBottom: '1px solid #E5E7EB' }}
              >
                <span style={{ fontWeight: 600, fontSize: 14, color: '#111827', fontFamily: 'Inter, sans-serif' }}>
                  Preview — {preview.length} emails ready to import
                </span>
                <button
                  onClick={importRows}
                  style={{
                    fontWeight: 500, fontSize: 13, padding: '8px 18px',
                    background: '#4F46E5', color: 'white', border: 'none',
                    borderRadius: 8, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    transition: 'all 150ms',
                  }}
                  onMouseEnter={e => { ;(e.currentTarget as HTMLButtonElement).style.background = '#4338CA' }}
                  onMouseLeave={e => { ;(e.currentTarget as HTMLButtonElement).style.background = '#4F46E5' }}
                >
                  Confirm import →
                </button>
              </div>
              <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                {preview.map((row, i) => (
                  <div
                    key={row.escalation_id}
                    className="flex items-start gap-3 px-6 py-3"
                    style={{
                      borderBottom: i < preview.length - 1 ? '1px solid #F3F4F6' : 'none',
                      transition: 'background-color 150ms',
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
                  >
                    {/* Score badge */}
                    <div
                      style={{
                        flexShrink: 0, width: 36, height: 36, borderRadius: 8,
                        backgroundColor: row.priority_bucket === 'High' ? '#FCEBEB'
                          : row.priority_bucket === 'Medium' ? '#FEF3C7' : '#D1FAE5',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 13,
                        color: PRIORITY_COLORS[row.priority_bucket] || '#059669',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {row.score}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 500, fontSize: 13, color: '#111827',
                          fontFamily: 'Inter, sans-serif',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}
                      >
                        {row.subject || '(no subject)'}
                      </div>
                      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2, fontFamily: 'Inter, sans-serif' }}>
                        {row.account_name} · {row.sender_name} · {row.age_hours}h ago
                      </div>
                    </div>
                    <span
                      style={{
                        flexShrink: 0, fontSize: 10, fontWeight: 500,
                        color: PRIORITY_COLORS[row.priority_bucket],
                        backgroundColor: row.priority_bucket === 'High' ? '#FCEBEB'
                          : row.priority_bucket === 'Medium' ? '#FEF3C7' : '#D1FAE5',
                        borderRadius: 20, padding: '2px 8px', fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {row.priority_bucket}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Done */}
          {status === 'done' && (
            <div
              className="fade-in-up"
              style={{
                background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 12,
                padding: '16px 20px', color: '#065F46', fontSize: 14,
                fontFamily: 'Inter, sans-serif', fontWeight: 500,
              }}
            >
              ✓ {importedCount} escalations imported successfully into Supabase.
            </div>
          )}
        </main>
      </div>
    </>
  )
}
