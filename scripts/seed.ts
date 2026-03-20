/* eslint-disable @typescript-eslint/no-require-imports */
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

import { createClient } from '@supabase/supabase-js'

const XLSX = require('xlsx')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Scoring engine (inlined to avoid path alias issues) ──────────────────────

type Tier = 'Enterprise' | 'Mid-Market' | 'SMB'
type Channel = 'WhatsApp' | 'Slack' | 'Email'
type Status = 'Open' | 'Blocked' | 'In Progress' | 'Closed'

interface RawRow {
  escalation_id?: string
  account_name?: string
  account_tier?: string
  channel?: string
  sender_name?: string
  subject?: string
  message?: string
  priority_hint?: string
  sla_hours?: number | string
  current_status?: string
  owner?: string
  age_hours?: number | string
  [key: string]: unknown
}

function scoreRow(row: Partial<RawRow> & { age_hours?: number; sla_hours?: number }) {
  const msg = ((row.message || '') + ' ' + (row.priority_hint || '')).toLowerCase()

  // Business value
  let dimBusiness = 0
  if (row.account_tier === 'Enterprise') dimBusiness = 20
  else if (row.account_tier === 'Mid-Market') dimBusiness = 12
  else dimBusiness = 5
  if (/renewal|premium|gmc|gpa|policy value/.test(msg)) dimBusiness += 5
  dimBusiness = Math.min(dimBusiness, 25)

  // Time & age
  const ageHours = row.age_hours || 0
  const slaHours = row.sla_hours || 24
  const ratio = ageHours / slaHours
  let dimTimeAge = 0
  if (ratio >= 3) dimTimeAge = 20
  else if (ratio >= 2) dimTimeAge = 15
  else if (ratio >= 1) dimTimeAge = 10
  else if (ratio >= 0.5) dimTimeAge = 5
  if (/missed.*deadline|committed.*deadline/.test(msg)) dimTimeAge += 5
  dimTimeAge = Math.min(dimTimeAge, 20)

  // Comms
  let dimComms = 0
  if (row.channel === 'WhatsApp') dimComms = 15
  else if (row.channel === 'Slack') dimComms = 10
  else dimComms = 7

  // Complexity
  let dimComplexity = 0
  if (/escalation/.test(msg)) dimComplexity = 15
  else if (/critical/.test(msg)) dimComplexity = 14
  else if (/no response/.test(msg)) dimComplexity = 12
  else if (/urgent/.test(msg)) dimComplexity = 11
  else if (/asap/.test(msg)) dimComplexity = 10
  else if (/stuck/.test(msg)) dimComplexity = 8
  else if (/delay/.test(msg)) dimComplexity = 6
  if (/claim|onboarding|medical|cashless|health id/.test(msg)) dimComplexity += 3
  dimComplexity = Math.min(dimComplexity, 18)

  // Risk
  let dimRisk = 0
  const riskFlags: string[] = []
  if (/irdai|legal|regulatory|not renewing|cancel|publicly/.test(msg)) {
    dimRisk = 15
    if (/not renewing|cancel/.test(msg)) riskFlags.push('churn')
    if (/irdai|legal|regulatory/.test(msg)) riskFlags.push('legal')
    if (/publicly/.test(msg)) riskFlags.push('social')
  } else if (/unhappy|escalate|disappointed|frustrated/.test(msg)) {
    dimRisk = 10
    riskFlags.push('churn')
  } else if (/urgent|asap|critical/.test(msg)) {
    dimRisk = 5
  }
  dimRisk = Math.min(dimRisk, 15)

  // Ownership
  let dimOwnership = 0
  if (row.current_status === 'Blocked') dimOwnership = 10
  else if (row.current_status === 'Open') dimOwnership = 8
  else if (row.current_status === 'In Progress') dimOwnership = 4

  // Historical
  let dimHistorical = 1
  if (/no response/.test(msg)) dimHistorical = 5
  else if (/escalation|critical/.test(msg)) dimHistorical = 3

  const score = Math.min(
    dimBusiness + dimTimeAge + dimComms + dimComplexity + dimRisk + dimOwnership + dimHistorical,
    100
  )
  const priority_bucket = score >= 70 ? 'High' : score >= 45 ? 'Medium' : 'Low'

  return {
    score, priority_bucket, risk_flags: riskFlags,
    dim_business: dimBusiness, dim_time_age: dimTimeAge,
    dim_comms: dimComms, dim_complexity: dimComplexity,
    dim_risk: dimRisk, dim_ownership: dimOwnership, dim_historical: dimHistorical,
  }
}

function getRuleBasedSummary(row: Partial<RawRow>) {
  const hint = (row.priority_hint || '').toLowerCase()
  const name = row.account_name || 'This account'

  if (hint.includes('escalation'))
    return `${name} has formally escalated a concern requiring immediate SVP attention. The issue has been flagged as high priority and needs swift resolution to maintain the account relationship.`
  if (hint.includes('critical'))
    return `A critical issue has been raised by ${name} that is blocking normal operations. Immediate intervention is required to prevent further impact.`
  if (hint.includes('no response'))
    return `${name} has not received a response to their previous communication. This gap needs to be addressed urgently to maintain trust and service standards.`
  if (hint.includes('urgent'))
    return `An urgent matter has been raised by ${name} requiring prompt attention. The time-sensitive nature demands swift action to meet client expectations.`
  if (hint.includes('asap'))
    return `${name} has flagged an issue requiring as-soon-as-possible resolution. The client's expectation of rapid turnaround must be managed carefully.`
  if (hint.includes('stuck'))
    return `Progress on ${name}'s request has stalled and requires intervention to unblock. The current blockage is causing frustration and needs coordinated resolution.`
  if (hint.includes('delay'))
    return `There has been an unexpected delay in delivering services to ${name}. A clear timeline and updated communication plan is needed to restore confidence.`
  return `${name} has raised an issue that requires follow-up from the account management team. The matter should be reviewed and addressed in a timely manner.`
}

// ── Main seed function ──────────────────────────────────────────────────────

async function main() {
  console.log('Connecting to Supabase...')

  // Check existing rows
  const { data: existing } = await supabase.from('escalations').select('escalation_id')
  const existingIds = new Set((existing || []).map((r: { escalation_id: string }) => r.escalation_id))
  console.log(`Found ${existingIds.size} existing rows — will skip duplicates`)

  // Try reading Excel file
  const filePath = path.resolve(__dirname, '../data/escalation_dummy_data.xlsx')
  let rows: RawRow[] = []
  let usedExcel = false

  try {
    const workbook = XLSX.readFile(filePath)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    rows = XLSX.utils.sheet_to_json(sheet)
    usedExcel = true
    console.log(`Read ${rows.length} rows from Excel file`)
  } catch {
    console.log('No Excel file found — generating 200 mock rows')
    rows = generateMockRows(200)
  }

  const total = rows.length
  let seeded = 0
  const batch: Record<string, unknown>[] = []

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i]
    const escalationId = String(raw.escalation_id || `ESC_${String(i + 1000).padStart(4, '0')}`)

    if (existingIds.has(escalationId)) continue

    const tier = (['Enterprise', 'Mid-Market', 'SMB'].includes(raw.account_tier as string)
      ? raw.account_tier : 'SMB') as Tier
    const channel = (['WhatsApp', 'Slack', 'Email'].includes(raw.channel as string)
      ? raw.channel : 'Email') as Channel
    const status = (['Open', 'Blocked', 'In Progress', 'Closed'].includes(raw.current_status as string)
      ? raw.current_status : 'Open') as Status
    const ageHours = raw.age_hours ? Number(raw.age_hours) : Math.random() * 168
    const slaHours = raw.sla_hours ? Number(raw.sla_hours) : (tier === 'Enterprise' ? 4 : tier === 'Mid-Market' ? 8 : 24)

    const base = {
      escalation_id: escalationId,
      account_name: String(raw.account_name || 'Unknown Account'),
      account_tier: tier,
      channel,
      sender_name: raw.sender_name ? String(raw.sender_name) : null,
      subject: raw.subject ? String(raw.subject) : null,
      message: raw.message ? String(raw.message) : null,
      priority_hint: raw.priority_hint ? String(raw.priority_hint) : null,
      sla_hours: slaHours,
      current_status: status,
      owner: raw.owner ? String(raw.owner) : '—',
      age_hours: ageHours,
    }

    const scored = scoreRow(base)
    const ai_summary = getRuleBasedSummary(base)

    batch.push({ ...base, ...scored, ai_summary, ai_action: 'Follow up' })

    if ((i + 1) % 100 === 0) console.log(`Seeding row ${i + 1} of ${total}...`)

    // Insert in batches of 50
    if (batch.length >= 50) {
      const { error } = await supabase.from('escalations').insert(batch)
      if (error) console.error('Batch insert error:', error.message)
      else seeded += batch.length
      batch.length = 0
    }
  }

  // Insert remaining
  if (batch.length > 0) {
    const { error } = await supabase.from('escalations').insert(batch)
    if (error) console.error('Final batch error:', error.message)
    else seeded += batch.length
  }

  console.log(`\nSeeded ${seeded} rows successfully${usedExcel ? ' from Excel' : ' (mock data)'}`)
}

function generateMockRows(count: number): RawRow[] {
  const ACCOUNTS = [
    'Tata Consultancy Services', 'Infosys', 'Wipro', 'HCL Technologies', 'Tech Mahindra',
    'Reliance Industries', 'HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Bajaj Auto',
    'Mahindra & Mahindra', 'Larsen & Toubro', 'Adani Enterprises', 'Bharti Airtel', 'Asian Paints',
    'Maruti Suzuki', 'Hindustan Unilever', 'ITC Limited', 'Nestle India', 'Britannia Industries',
    'Sun Pharma', 'Dr Reddys Labs', 'Cipla', 'UltraTech Cement', 'Grasim Industries',
    'NTPC', 'Power Grid Corp', 'Coal India', 'ONGC', 'IOC',
  ]
  const TIERS: Tier[] = ['Enterprise', 'Enterprise', 'Mid-Market', 'Mid-Market', 'SMB']
  const CHANNELS: Channel[] = ['WhatsApp', 'WhatsApp', 'Slack', 'Email', 'Email']
  const STATUSES: Status[] = ['Open', 'Open', 'Blocked', 'In Progress', 'Closed']
  const HINTS = ['escalation', 'critical', 'no response', 'urgent', 'asap', 'stuck', 'delay']
  const OWNERS = ['Priya Sharma', 'Rahul Mehta', 'Anita Singh', 'Vikram Patel', 'Deepa Nair', '—', '—']
  const MESSAGES = [
    'We have not received any response to our previous emails. This is an urgent escalation that needs immediate attention from senior management.',
    'The claim settlement has been stuck for over 2 weeks. Our employees are frustrated and threatening to cancel the policy.',
    'IRDAI compliance deadline is approaching and we still havent received the required documents. Legal action may follow.',
    'Cashless facility was denied at the hospital. This is critical and needs to be resolved asap.',
    'The onboarding process has been delayed significantly. Our renewal is due next month and we are reconsidering publicly.',
    'No response from the account manager. We are extremely disappointed with the service levels.',
    'Medical reimbursement claim is stuck in processing. The employee is frustrated and escalating internally.',
    'The GPA policy renewal premium quote is pending. We need this urgently for budget approval.',
  ]

  return Array.from({ length: count }, (_, i) => ({
    escalation_id: `ESC_${String(i + 1000).padStart(4, '0')}`,
    account_name: ACCOUNTS[i % ACCOUNTS.length],
    account_tier: TIERS[i % TIERS.length],
    channel: CHANNELS[i % CHANNELS.length],
    sender_name: `HR Contact ${i + 1}`,
    subject: `Issue: ${HINTS[i % HINTS.length]}`,
    message: MESSAGES[i % MESSAGES.length],
    priority_hint: HINTS[i % HINTS.length],
    sla_hours: TIERS[i % TIERS.length] === 'Enterprise' ? 4 : TIERS[i % TIERS.length] === 'Mid-Market' ? 8 : 24,
    current_status: STATUSES[i % STATUSES.length],
    owner: OWNERS[i % OWNERS.length],
    age_hours: Math.round(Math.random() * 240),
  }))
}

main().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
