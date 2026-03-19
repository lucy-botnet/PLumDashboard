export interface EscalationRow {
  id: string
  escalation_id: string
  account_name: string
  account_tier: 'Enterprise' | 'Mid-Market' | 'SMB'
  channel: 'WhatsApp' | 'Slack' | 'Email'
  sender_name: string | null
  subject: string | null
  message: string | null
  priority_hint: string | null
  sla_hours: number | null
  current_status: 'Open' | 'Blocked' | 'In Progress' | 'Closed'
  owner: string
  score: number
  priority_bucket: 'High' | 'Medium' | 'Low'
  ai_summary: string | null
  ai_action: string | null
  risk_flags: string[]
  dim_business: number
  dim_time_age: number
  dim_comms: number
  dim_complexity: number
  dim_risk: number
  dim_ownership: number
  dim_historical: number
  age_hours: number
  created_at: string
  updated_at: string
}

export interface ScoredEscalation extends EscalationRow {
  score: number
  priority_bucket: 'High' | 'Medium' | 'Low'
  risk_flags: string[]
  dim_business: number
  dim_time_age: number
  dim_comms: number
  dim_complexity: number
  dim_risk: number
  dim_ownership: number
  dim_historical: number
}

export interface Stats {
  totalOpen: number
  high: number
  medium: number
  low: number
  blocked: number
  slaBreach: number
  avgAge: number
  byChannel: { WhatsApp: number; Slack: number; Email: number }
  byTier: { Enterprise: number; 'Mid-Market': number; SMB: number }
  byStatus: { Open: number; Blocked: number; 'In Progress': number; Closed: number }
  scoreDistribution: {
    '0-30': number
    '31-45': number
    '46-60': number
    '61-70': number
    '71-85': number
    '86-100': number
  }
  avgScoreBySegment: {
    Enterprise: number
    'Mid-Market': number
    SMB: number
    WhatsApp: number
    Slack: number
    Email: number
  }
  dimAverages: {
    business: number
    timeAge: number
    comms: number
    complexity: number
    risk: number
    ownership: number
    historical: number
  }
  slaBreachBySegment: {
    Enterprise: number
    'Mid-Market': number
    SMB: number
    WhatsApp: number
    Slack: number
    Email: number
  }
  oldestCases: EscalationRow[]
  ownershipLoad: Array<{ owner: string; count: number; highCount: number }>
}

export interface FilterState {
  priority: string | null
  status: string | null
  channel: string | null
  tier: string | null
  owner: string | null
  scoreRange: [number, number] | null
  sortBy: 'score_desc' | 'age_desc' | 'age_asc' | 'account_asc'
  search: string
  page: number
}

export interface GroupedAccount {
  name: string
  escalations: EscalationRow[]
  topScore: number
  topPriority: 'High' | 'Medium' | 'Low'
  topStatus: string
  topChannel: string
  topHint: string | null
  riskFlags: string[]
  aiSummary: string | null
}
