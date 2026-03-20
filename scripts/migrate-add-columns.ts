/**
 * Migration script: add new columns to escalations table
 * Run with: npx ts-node scripts/migrate-add-columns.ts
 *
 * SQL to run in Supabase dashboard first:
 * ALTER TABLE escalations
 *   ADD COLUMN IF NOT EXISTS root_cause TEXT DEFAULT NULL,
 *   ADD COLUMN IF NOT EXISTS b2b_or_b2c TEXT CHECK (b2b_or_b2c IN ('B2B','B2C')) DEFAULT 'B2B',
 *   ADD COLUMN IF NOT EXISTS resolution_deadline TIMESTAMPTZ DEFAULT NULL,
 *   ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ DEFAULT NULL,
 *   ADD COLUMN IF NOT EXISTS resolution_hours NUMERIC DEFAULT NULL,
 *   ADD COLUMN IF NOT EXISTS max_resolution_hours INTEGER DEFAULT NULL,
 *   ADD COLUMN IF NOT EXISTS csat_score INTEGER DEFAULT NULL,
 *   ADD COLUMN IF NOT EXISTS response_sent_at TIMESTAMPTZ DEFAULT NULL,
 *   ADD COLUMN IF NOT EXISTS first_response_hours NUMERIC DEFAULT NULL,
 *   ADD COLUMN IF NOT EXISTS resolved_by TEXT DEFAULT NULL,
 *   ADD COLUMN IF NOT EXISTS employee_id TEXT DEFAULT NULL;
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const ROOT_CAUSE_MAP: Record<string, string> = {
  escalation: 'Unresolved claim',
  critical: 'Service failure',
  'no response': 'Communication gap',
  urgent: 'Process delay',
  asap: 'SLA breach',
  stuck: 'Approval bottleneck',
  delay: 'Ops processing delay',
}

const OWNER_EMPLOYEE_MAP: Record<string, string> = {}
let empCounter = 1

function getEmployeeId(owner: string): string {
  if (!owner || owner === '—') return 'EMP-000'
  if (!OWNER_EMPLOYEE_MAP[owner]) {
    OWNER_EMPLOYEE_MAP[owner] = `EMP-${String(empCounter++).padStart(3, '0')}`
  }
  return OWNER_EMPLOYEE_MAP[owner]
}

function getRootCause(priorityHint: string | null): string {
  if (!priorityHint) return 'Process delay'
  const lower = priorityHint.toLowerCase()
  for (const [key, value] of Object.entries(ROOT_CAUSE_MAP)) {
    if (lower.includes(key)) return value
  }
  return 'Process delay'
}

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10
}

async function migrate() {
  console.log('Fetching all escalations...')
  const { data: rows, error } = await supabase
    .from('escalations')
    .select('id, priority_hint, sla_hours, current_status, owner, age_hours')

  if (error) {
    console.error('Error fetching rows:', error)
    process.exit(1)
  }

  console.log(`Found ${rows?.length || 0} rows to update`)

  const updates = (rows || []).map(row => {
    const slaHours = row.sla_hours || 24
    const isClosed = row.current_status === 'Closed'
    const b2bOrB2c = Math.random() < 0.6 ? 'B2B' : 'B2C'
    const rootCause = getRootCause(row.priority_hint)
    const maxResolutionHours = Math.round(slaHours * 1.5)
    const resolutionHours = isClosed
      ? randomBetween(slaHours * 0.5, slaHours * 1.8)
      : null
    const csatScore = isClosed ? Math.floor(randomBetween(55, 95)) : null
    const firstResponseHours = randomBetween(1, 24)
    const owner = row.owner && row.owner !== '—' ? row.owner : null
    const resolvedBy = isClosed && owner ? owner : null
    const employeeId = owner ? getEmployeeId(owner) : null

    const now = new Date()
    const resolvedAt = isClosed && resolutionHours
      ? new Date(now.getTime() - (row.age_hours - resolutionHours) * 3600000).toISOString()
      : null
    const resolutionDeadline = new Date(
      now.getTime() + (maxResolutionHours - (row.age_hours || 0)) * 3600000
    ).toISOString()

    return {
      id: row.id,
      root_cause: rootCause,
      b2b_or_b2c: b2bOrB2c,
      resolution_deadline: resolutionDeadline,
      resolved_at: resolvedAt,
      resolution_hours: resolutionHours,
      max_resolution_hours: maxResolutionHours,
      csat_score: csatScore,
      first_response_hours: firstResponseHours,
      resolved_by: resolvedBy,
      employee_id: employeeId,
    }
  })

  // Update in batches of 50
  const BATCH_SIZE = 50
  let updated = 0
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(
      batch.map(u =>
        supabase
          .from('escalations')
          .update({
            root_cause: u.root_cause,
            b2b_or_b2c: u.b2b_or_b2c,
            resolution_deadline: u.resolution_deadline,
            resolved_at: u.resolved_at,
            resolution_hours: u.resolution_hours,
            max_resolution_hours: u.max_resolution_hours,
            csat_score: u.csat_score,
            first_response_hours: u.first_response_hours,
            resolved_by: u.resolved_by,
            employee_id: u.employee_id,
          })
          .eq('id', u.id)
      )
    )
    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
      console.error('Errors in batch:', errors.map(r => r.error))
    }
    updated += batch.length - errors.length
    console.log(`Updated ${updated} / ${updates.length}`)
  }

  console.log('Migration complete!')
  console.log('Employee ID map:', OWNER_EMPLOYEE_MAP)
}

migrate().catch(console.error)
