/* eslint-disable @typescript-eslint/no-require-imports */
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

import { createClient } from '@supabase/supabase-js'
import { scoreEscalation } from '../lib/scoring'
import { generateAISummary, getRuleBasedSummary } from '../lib/ai'

const XLSX = require('xlsx')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

async function main() {
  // Read xlsx file
  const filePath = path.resolve(__dirname, '../data/escalation_dummy_data.xlsx')
  let workbook: ReturnType<typeof XLSX.readFile>
  try {
    workbook = XLSX.readFile(filePath)
  } catch {
    console.error(`Cannot read file at ${filePath}`)
    console.log('Creating mock data instead...')
    await seedMockData()
    return
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: RawRow[] = XLSX.utils.sheet_to_json(sheet)
  const total = rows.length

  console.log(`Found ${total} rows in spreadsheet`)

  // Fetch existing escalation_ids to skip duplicates
  const { data: existing } = await supabase
    .from('escalations')
    .select('escalation_id')
  const existingIds = new Set((existing || []).map(r => r.escalation_id))

  let seeded = 0
  const batchSize = 50

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i]
    const escalationId = String(raw.escalation_id || `ESC_${i + 1000}`)

    if (existingIds.has(escalationId)) {
      continue
    }

    const baseRow = {
      escalation_id: escalationId,
      account_name: String(raw.account_name || 'Unknown Account'),
      account_tier: (['Enterprise', 'Mid-Market', 'SMB'].includes(raw.account_tier as string)
        ? raw.account_tier : 'SMB') as 'Enterprise' | 'Mid-Market' | 'SMB',
      channel: (['WhatsApp', 'Slack', 'Email'].includes(raw.channel as string)
        ? raw.channel : 'Email') as 'WhatsApp' | 'Slack' | 'Email',
      sender_name: raw.sender_name ? String(raw.sender_name) : null,
      subject: raw.subject ? String(raw.subject) : null,
      message: raw.message ? String(raw.message) : null,
      priority_hint: raw.priority_hint ? String(raw.priority_hint) : null,
      sla_hours: raw.sla_hours ? Number(raw.sla_hours) : 24,
      current_status: (['Open', 'Blocked', 'In Progress', 'Closed'].includes(raw.current_status as string)
        ? raw.current_status : 'Open') as 'Open' | 'Blocked' | 'In Progress' | 'Closed',
      owner: raw.owner ? String(raw.owner) : '—',
      age_hours: raw.age_hours ? Number(raw.age_hours) : Math.random() * 168,
    }

    // Score the escalation
    const scored = scoreEscalation(baseRow)

    // Generate AI summary
    let aiResult
    if (i < 50) {
      try {
        aiResult = await generateAISummary(baseRow)
      } catch {
        aiResult = getRuleBasedSummary(baseRow)
      }
    } else {
      aiResult = getRuleBasedSummary(baseRow)
    }

    const record = {
      ...scored,
      ai_summary: aiResult.summary,
      ai_action: aiResult.action,
      risk_flags: [...new Set([...(scored.risk_flags || []), ...(aiResult.risk_flags || [])])],
    }

    // Remove computed fields not in DB schema (id will be generated)
    const { id: _id, created_at: _ca, updated_at: _ua, ...insertData } = record

    const { error } = await supabase.from('escalations').insert(insertData)
    if (error) {
      console.error(`Error inserting row ${i}:`, error.message)
    } else {
      seeded++
    }

    if ((i + 1) % 100 === 0) {
      console.log(`Seeding row ${i + 1} of ${total}...`)
    }

    // Throttle to avoid rate limits
    if (i < 50 && i % 10 === 9) {
      await new Promise(r => setTimeout(r, 500))
    }

    // Insert in batches
    if (seeded % batchSize === 0 && seeded > 0) {
      await new Promise(r => setTimeout(r, 200))
    }
  }

  console.log(`Seeded ${seeded} rows successfully`)
}

async function seedMockData() {
  const ACCOUNTS = [
    'Tata Consultancy Services', 'Infosys', 'Wipro', 'HCL Technologies', 'Tech Mahindra',
    'Reliance Industries', 'HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Bajaj Auto',
    'Mahindra & Mahindra', 'Larsen & Toubro', 'Adani Enterprises', 'Bharti Airtel', 'Asian Paints',
    'Maruti Suzuki', 'Hindustan Unilever', 'ITC Limited', 'Nestle India', 'Britannia Industries',
  ]
  const TIERS = ['Enterprise', 'Mid-Market', 'SMB'] as const
  const CHANNELS = ['WhatsApp', 'Slack', 'Email'] as const
  const STATUSES = ['Open', 'Blocked', 'In Progress', 'Closed'] as const
  const HINTS = ['escalation', 'critical', 'no response', 'urgent', 'asap', 'stuck', 'delay']
  const OWNERS = ['Priya Sharma', 'Rahul Mehta', 'Anita Singh', 'Vikram Patel', '—']

  const rows = []
  for (let i = 0; i < 200; i++) {
    const account = ACCOUNTS[i % ACCOUNTS.length]
    const tier = TIERS[Math.floor(Math.random() * TIERS.length)]
    const channel = CHANNELS[Math.floor(Math.random() * CHANNELS.length)]
    const status = STATUSES[Math.floor(Math.random() * STATUSES.length)]
    const hint = HINTS[Math.floor(Math.random() * HINTS.length)]
    const owner = OWNERS[Math.floor(Math.random() * OWNERS.length)]
    const ageHours = Math.random() * 240

    const base = {
      escalation_id: `ESC_${String(i + 1000).padStart(4, '0')}`,
      account_name: account,
      account_tier: tier,
      channel,
      sender_name: `Contact ${i}`,
      subject: `Issue regarding ${hint}`,
      message: `This is an ${hint} situation. We need immediate attention to resolve the issue with our ${tier.toLowerCase()} account. The matter is urgent and requires escalation to the SVP level.`,
      priority_hint: hint,
      sla_hours: tier === 'Enterprise' ? 4 : tier === 'Mid-Market' ? 8 : 24,
      current_status: status,
      owner,
      age_hours: ageHours,
    }

    const scored = scoreEscalation(base)
    const aiResult = getRuleBasedSummary(base)

    rows.push({
      ...scored,
      ai_summary: aiResult.summary,
      ai_action: aiResult.action,
      risk_flags: [...new Set([...(scored.risk_flags || []), ...(aiResult.risk_flags || [])])],
    })
  }

  // Batch insert
  const batchSize = 20
  let seeded = 0
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize).map(r => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, created_at: _ca, updated_at: _ua, ...data } = r
      return data
    })
    const { error } = await supabase.from('escalations').insert(batch)
    if (error) {
      console.error(`Batch insert error:`, error.message)
    } else {
      seeded += batch.length
    }
    if ((i + batchSize) % 100 === 0) {
      console.log(`Seeding row ${i + batchSize} of ${rows.length}...`)
    }
  }
  console.log(`Seeded ${seeded} mock rows successfully`)
}

main().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
