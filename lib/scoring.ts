import type { EscalationRow, ScoredEscalation } from '@/types'

function scoreBusiness(row: Partial<EscalationRow>): number {
  let score = 0
  switch (row.account_tier) {
    case 'Enterprise': score = 20; break
    case 'Mid-Market': score = 12; break
    case 'SMB': score = 5; break
    default: score = 0
  }
  const msg = (row.message || '').toLowerCase()
  if (/renewal|premium|gmc|gpa|policy value/.test(msg)) score += 5
  return Math.min(score, 25)
}

function scoreTimeAge(row: Partial<EscalationRow>): number {
  const ageHours = row.age_hours || 0
  const slaHours = row.sla_hours || 24
  const ratio = ageHours / slaHours
  let score = 0
  if (ratio >= 3) score = 20
  else if (ratio >= 2) score = 15
  else if (ratio >= 1) score = 10
  else if (ratio >= 0.5) score = 5
  const msg = (row.message || '').toLowerCase()
  if (/missed.*deadline|committed.*deadline|promised.*by|due.*date/.test(msg)) score += 5
  return Math.min(score, 20)
}

function scoreComms(row: Partial<EscalationRow>): number {
  switch (row.channel) {
    case 'WhatsApp': return 15
    case 'Slack': return 10
    case 'Email': return 7
    default: return 0
  }
}

function scoreComplexity(row: Partial<EscalationRow>): number {
  const msg = (row.message || '').toLowerCase()
  const hint = (row.priority_hint || '').toLowerCase()
  const combined = msg + ' ' + hint
  let score = 0
  if (/escalation/.test(combined)) score = 15
  else if (/critical/.test(combined)) score = 14
  else if (/no response|no-response/.test(combined)) score = 12
  else if (/urgent/.test(combined)) score = 11
  else if (/asap/.test(combined)) score = 10
  else if (/stuck/.test(combined)) score = 8
  else if (/delay/.test(combined)) score = 6
  if (/claim|onboarding|medical|cashless|health id/.test(combined)) score += 3
  return Math.min(score, 18)
}

function scoreRisk(row: Partial<EscalationRow>): { score: number; flags: string[] } {
  const msg = (row.message || '').toLowerCase()
  const flags: string[] = []
  let score = 0

  if (/irdai|legal|regulatory|not renewing|cancel|publicly/.test(msg)) {
    score += 15
    if (/not renewing|cancel/.test(msg)) flags.push('churn')
    if (/irdai|legal|regulatory/.test(msg)) flags.push('legal')
    if (/publicly/.test(msg)) flags.push('social')
  } else if (/unhappy|escalate|disappointed|frustrated/.test(msg)) {
    score += 10
    if (/unhappy|disappointed|frustrated/.test(msg)) flags.push('churn')
  } else if (/urgent|asap|critical/.test(msg)) {
    score += 5
  }

  return { score: Math.min(score, 15), flags }
}

function scoreOwnership(row: Partial<EscalationRow>): number {
  switch (row.current_status) {
    case 'Blocked': return 10
    case 'Open': return 8
    case 'In Progress': return 4
    case 'Closed': return 0
    default: return 0
  }
}

function scoreHistorical(row: Partial<EscalationRow>): number {
  const msg = (row.message || '').toLowerCase()
  const hint = (row.priority_hint || '').toLowerCase()
  const combined = msg + ' ' + hint
  if (/no response|no-response/.test(combined)) return 5
  if (/escalation|critical/.test(combined)) return 3
  return 1
}

export function scoreEscalation(row: Partial<EscalationRow>): ScoredEscalation {
  const dimBusiness = scoreBusiness(row)
  const dimTimeAge = scoreTimeAge(row)
  const dimComms = scoreComms(row)
  const dimComplexity = scoreComplexity(row)
  const { score: dimRisk, flags } = scoreRisk(row)
  const dimOwnership = scoreOwnership(row)
  const dimHistorical = scoreHistorical(row)

  const totalScore = Math.min(
    dimBusiness + dimTimeAge + dimComms + dimComplexity + dimRisk + dimOwnership + dimHistorical,
    100
  )

  let priorityBucket: 'High' | 'Medium' | 'Low'
  if (totalScore >= 70) priorityBucket = 'High'
  else if (totalScore >= 45) priorityBucket = 'Medium'
  else priorityBucket = 'Low'

  return {
    ...row,
    id: row.id || '',
    escalation_id: row.escalation_id || '',
    account_name: row.account_name || '',
    account_tier: row.account_tier || 'SMB',
    channel: row.channel || 'Email',
    sender_name: row.sender_name || null,
    subject: row.subject || null,
    message: row.message || null,
    priority_hint: row.priority_hint || null,
    sla_hours: row.sla_hours || 24,
    current_status: row.current_status || 'Open',
    owner: row.owner || '—',
    ai_summary: row.ai_summary || null,
    ai_action: row.ai_action || null,
    age_hours: row.age_hours || 0,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
    score: totalScore,
    priority_bucket: priorityBucket,
    risk_flags: Array.from(new Set([...(row.risk_flags || []), ...flags])),
    dim_business: dimBusiness,
    dim_time_age: dimTimeAge,
    dim_comms: dimComms,
    dim_complexity: dimComplexity,
    dim_risk: dimRisk,
    dim_ownership: dimOwnership,
    dim_historical: dimHistorical,
  } as ScoredEscalation
}
