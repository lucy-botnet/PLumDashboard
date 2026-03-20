'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ACCOUNTS = [
  { name: 'Tata Consultancy Services', tier: 'Enterprise' },
  { name: 'Infosys', tier: 'Enterprise' },
  { name: 'Wipro', tier: 'Enterprise' },
  { name: 'HCL Technologies', tier: 'Enterprise' },
  { name: 'Tech Mahindra', tier: 'Enterprise' },
  { name: 'Reliance Industries', tier: 'Enterprise' },
  { name: 'HDFC Bank', tier: 'Enterprise' },
  { name: 'ICICI Bank', tier: 'Mid-Market' },
  { name: 'State Bank of India', tier: 'Mid-Market' },
  { name: 'Bajaj Auto', tier: 'Mid-Market' },
  { name: 'Mahindra & Mahindra', tier: 'Mid-Market' },
  { name: 'Larsen & Toubro', tier: 'Mid-Market' },
  { name: 'Adani Enterprises', tier: 'Mid-Market' },
  { name: 'Bharti Airtel', tier: 'Mid-Market' },
  { name: 'Asian Paints', tier: 'SMB' },
  { name: 'Maruti Suzuki', tier: 'SMB' },
  { name: 'Hindustan Unilever', tier: 'SMB' },
  { name: 'ITC Limited', tier: 'SMB' },
  { name: 'Nestle India', tier: 'SMB' },
  { name: 'Britannia Industries', tier: 'SMB' },
  { name: 'Sun Pharma', tier: 'Enterprise' },
  { name: 'Dr Reddys Labs', tier: 'Mid-Market' },
  { name: 'Cipla', tier: 'Mid-Market' },
  { name: 'UltraTech Cement', tier: 'SMB' },
  { name: 'Grasim Industries', tier: 'SMB' },
  { name: 'NTPC', tier: 'Enterprise' },
  { name: 'Power Grid Corp', tier: 'Mid-Market' },
  { name: 'Coal India', tier: 'SMB' },
  { name: 'ONGC', tier: 'Enterprise' },
  { name: 'Bajaj Finserv', tier: 'Mid-Market' },
]

const CHANNELS = ['WhatsApp', 'WhatsApp', 'Slack', 'Email', 'Email']
const STATUSES = ['Open', 'Open', 'Blocked', 'In Progress', 'Closed']
const HINTS = ['escalation', 'critical', 'no response', 'urgent', 'asap', 'stuck', 'delay']
const OWNERS = ['Priya Sharma', 'Rahul Mehta', 'Anita Singh', 'Vikram Patel', 'Deepa Nair', '—', '—']
const MESSAGES = [
  'We have not received any response to our previous emails regarding the claim settlement. This is an urgent escalation that needs immediate attention from senior management. Our employees are impacted.',
  'The claim settlement has been stuck for over 2 weeks. Our HR team is frustrated and the employees are threatening to cancel the GMC policy at renewal.',
  'IRDAI compliance deadline is approaching and we still have not received the required policy documents. Legal action may follow if not resolved immediately.',
  'Cashless facility was denied at the hospital. This is critical and needs to be resolved asap. The employee is currently admitted.',
  'The onboarding process has been delayed significantly. Our renewal is due next month and we are reconsidering our options publicly.',
  'No response from the account manager for 5 days. We are extremely disappointed and frustrated with the service levels at Plum.',
  'Medical reimbursement claim is stuck in processing for 3 weeks. The employee is escalating internally and this is critical.',
  'The GPA policy renewal premium quote is pending. We need this urgently for board budget approval before end of quarter.',
  'Health ID cards have not been issued to 200 employees even after 6 weeks of onboarding. This is causing cashless denial issues.',
  'Policy document has errors in employee names and coverage amounts. Multiple claims have been rejected because of this. Urgent fix needed.',
]

function scoreRow(row: Record<string, string | number | null>) {
  const msg = (String(row.message || '') + ' ' + String(row.priority_hint || '')).toLowerCase()
  const tier = row.account_tier as string
  const channel = row.channel as string
  const status = row.current_status as string

  let dimBusiness = tier === 'Enterprise' ? 20 : tier === 'Mid-Market' ? 12 : 5
  if (/renewal|premium|gmc|gpa|policy value/.test(msg)) dimBusiness = Math.min(dimBusiness + 5, 25)

  const ratio = (Number(row.age_hours) || 0) / (Number(row.sla_hours) || 24)
  let dimTimeAge = ratio >= 3 ? 20 : ratio >= 2 ? 15 : ratio >= 1 ? 10 : ratio >= 0.5 ? 5 : 0
  if (/missed.*deadline|committed.*deadline/.test(msg)) dimTimeAge = Math.min(dimTimeAge + 5, 20)

  const dimComms = channel === 'WhatsApp' ? 15 : channel === 'Slack' ? 10 : 7

  let dimComplexity = /escalation/.test(msg) ? 15 : /critical/.test(msg) ? 14 : /no response/.test(msg) ? 12
    : /urgent/.test(msg) ? 11 : /asap/.test(msg) ? 10 : /stuck/.test(msg) ? 8 : /delay/.test(msg) ? 6 : 3
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

  const score = Math.min(dimBusiness + dimTimeAge + dimComms + dimComplexity + dimRisk + dimOwnership + dimHistorical, 100)
  const priority_bucket = score >= 70 ? 'High' : score >= 45 ? 'Medium' : 'Low'

  return { score, priority_bucket, risk_flags: riskFlags, dim_business: dimBusiness, dim_time_age: dimTimeAge, dim_comms: dimComms, dim_complexity: dimComplexity, dim_risk: dimRisk, dim_ownership: dimOwnership, dim_historical: dimHistorical }
}

function getSummary(hint: string, name: string, tier: string) {
  if (hint.includes('escalation')) return `${name} (${tier}) has formally escalated a concern requiring immediate SVP attention. The issue has been flagged as high priority and needs swift resolution to maintain the account relationship.`
  if (hint.includes('critical')) return `A critical issue has been raised by ${name} that is blocking normal operations. Immediate intervention is required to prevent further business impact.`
  if (hint.includes('no response')) return `${name} has not received a response to their previous communication. This communication gap is damaging trust and needs urgent attention to meet service standards.`
  if (hint.includes('urgent')) return `An urgent matter has been raised by ${name} requiring prompt attention. The time-sensitive nature demands swift action to meet client expectations and prevent escalation.`
  if (hint.includes('asap')) return `${name} has flagged an issue requiring as-soon-as-possible resolution. The client's expectation of rapid turnaround must be managed carefully to preserve the relationship.`
  if (hint.includes('stuck')) return `Progress on ${name}'s request has stalled and requires intervention to unblock. The current blockage is causing frustration and needs coordinated resolution across teams.`
  if (hint.includes('delay')) return `There has been an unexpected delay in delivering services to ${name}. A clear timeline and updated communication plan is needed to restore client confidence.`
  return `${name} has raised an issue that requires follow-up from the account management team. The matter should be reviewed and addressed in a timely manner to maintain the account relationship.`
}

function generateRows(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const account = ACCOUNTS[i % ACCOUNTS.length]
    const channel = CHANNELS[i % CHANNELS.length]
    const status = STATUSES[i % STATUSES.length]
    const hint = HINTS[i % HINTS.length]
    const owner = OWNERS[i % OWNERS.length]
    const slaHours = account.tier === 'Enterprise' ? 4 : account.tier === 'Mid-Market' ? 8 : 24
    const ageHours = Math.round(Math.random() * 240 + 1)
    const message = MESSAGES[i % MESSAGES.length]

    const base = {
      escalation_id: `ESC_${String(i + 1000).padStart(4, '0')}`,
      account_name: account.name,
      account_tier: account.tier,
      channel,
      sender_name: `HR Contact ${i + 1}`,
      subject: `Re: ${hint} - action needed`,
      message,
      priority_hint: hint,
      sla_hours: slaHours,
      current_status: status,
      owner,
      age_hours: ageHours,
      ai_action: 'Follow up',
      ai_summary: getSummary(hint, account.name, account.tier),
    }

    const scored = scoreRow(base as Record<string, string | number | null>)
    return { ...base, ...scored }
  })
}

export default function SeedPage() {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [log, setLog] = useState<string[]>([])
  const [count, setCount] = useState(200)

  const addLog = (msg: string) => setLog(prev => [...prev, msg])

  const runSeed = async () => {
    setStatus('running')
    setLog([])

    try {
      addLog('Checking existing rows...')
      const { data: existing } = await supabase.from('escalations').select('escalation_id')
      const existingIds = new Set((existing || []).map(r => r.escalation_id))
      addLog(`Found ${existingIds.size} existing rows — skipping duplicates`)

      const rows = generateRows(count).filter(r => !existingIds.has(r.escalation_id))
      addLog(`Inserting ${rows.length} new rows in batches...`)

      const BATCH = 50
      let inserted = 0
      for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH)
        const { error } = await supabase.from('escalations').insert(batch)
        if (error) {
          addLog(`❌ Error on batch ${Math.floor(i / BATCH) + 1}: ${error.message}`)
        } else {
          inserted += batch.length
          addLog(`✓ Inserted rows ${i + 1}–${Math.min(i + BATCH, rows.length)}`)
        }
      }

      addLog(`\n✅ Done! Seeded ${inserted} rows.`)
      setStatus('done')
    } catch (err) {
      addLog(`❌ Fatal error: ${String(err)}`)
      setStatus('error')
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, padding: 40, width: '100%', maxWidth: 560, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, backgroundColor: '#4F46E5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 18 }}>P</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16, color: '#111827' }}>Seed Database</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Plum Escalation Dashboard</div>
          </div>
        </div>

        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20, lineHeight: 1.6 }}>
          This will insert mock escalation data into your Supabase database. Existing rows are skipped automatically.
        </p>

        {/* Row count selector */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
            Number of rows
          </label>
          <select
            value={count}
            onChange={e => setCount(Number(e.target.value))}
            disabled={status === 'running'}
            style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#111827', backgroundColor: 'white', width: '100%' }}
          >
            <option value={100}>100 rows</option>
            <option value={200}>200 rows</option>
            <option value={500}>500 rows</option>
          </select>
        </div>

        {/* Seed button */}
        <button
          onClick={runSeed}
          disabled={status === 'running'}
          style={{
            width: '100%', padding: '10px 0', backgroundColor: status === 'running' ? '#C7D2FE' : '#4F46E5',
            color: 'white', border: 'none', borderRadius: 8, fontWeight: 500, fontSize: 14,
            cursor: status === 'running' ? 'not-allowed' : 'pointer', marginBottom: 20,
          }}
        >
          {status === 'running' ? 'Seeding...' : status === 'done' ? 'Seed again' : 'Seed Database'}
        </button>

        {/* Log output */}
        {log.length > 0 && (
          <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 16, maxHeight: 240, overflowY: 'auto' }}>
            {log.map((line, i) => (
              <div key={i} style={{ fontSize: 12, color: line.startsWith('❌') ? '#DC2626' : line.startsWith('✅') ? '#059669' : '#374151', fontFamily: 'monospace', marginBottom: 4, whiteSpace: 'pre-wrap' }}>
                {line}
              </div>
            ))}
          </div>
        )}

        {/* Go to dashboard link */}
        {status === 'done' && (
          <a
            href="../dashboard/overview"
            style={{ display: 'block', textAlign: 'center', marginTop: 16, color: '#4F46E5', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}
          >
            Go to Dashboard →
          </a>
        )}
      </div>
    </div>
  )
}
