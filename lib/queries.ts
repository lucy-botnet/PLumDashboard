import { supabase } from './supabase'
import type { EscalationRow, FilterState, GroupedAccount, Stats } from '@/types'

const PAGE_SIZE = 20

export async function fetchStats(since?: string): Promise<Stats> {
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const lastMonthEnd = currentMonthStart

  // Build base queries with optional date filter
  let q0 = supabase.from('escalations').select('priority_bucket, age_hours, sla_hours, score, dim_business, dim_time_age, dim_comms, dim_complexity, dim_risk, dim_ownership, dim_historical').neq('current_status', 'Closed')
  let q1 = supabase.from('escalations').select('channel, score').neq('current_status', 'Closed')
  let q2 = supabase.from('escalations').select('account_tier, score').neq('current_status', 'Closed')
  let q3 = supabase.from('escalations').select('current_status').neq('current_status', 'Closed')
  let q4 = supabase.from('escalations').select('score').neq('current_status', 'Closed')
  let q5 = supabase.from('escalations').select('*').neq('current_status', 'Closed').order('age_hours', { ascending: false }).limit(5)
  let q6 = supabase.from('escalations').select('owner, priority_bucket').neq('current_status', 'Closed')
  let q7 = supabase.from('escalations').select('channel, account_tier, sla_hours, age_hours').neq('current_status', 'Closed')

  if (since) {
    q0 = q0.gte('created_at', since)
    q1 = q1.gte('created_at', since)
    q2 = q2.gte('created_at', since)
    q3 = q3.gte('created_at', since)
    q4 = q4.gte('created_at', since)
    q5 = q5.gte('created_at', since)
    q6 = q6.gte('created_at', since)
    q7 = q7.gte('created_at', since)
  }

  // New data queries
  const qRootCause = supabase
    .from('escalations')
    .select('root_cause, resolution_hours, b2b_or_b2c')
    .not('root_cause', 'is', null)

  const qB2b = supabase
    .from('escalations')
    .select('b2b_or_b2c, priority_bucket')
    .neq('current_status', 'Closed')

  const qResponseCsat = supabase
    .from('escalations')
    .select('first_response_hours, csat_score, resolved_at, current_status, created_at')

  const qTimeline = supabase
    .from('escalations')
    .select('created_at, resolved_at')
    .order('created_at', { ascending: true })

  const qOpenHigh = supabase
    .from('escalations')
    .select('*')
    .eq('priority_bucket', 'High')
    .neq('current_status', 'Closed')
    .not('max_resolution_hours', 'is', null)
    .order('age_hours', { ascending: false })
    .limit(5)

  const qPerformers = supabase
    .from('escalations')
    .select('resolved_by, employee_id, resolved_at')
    .not('resolved_at', 'is', null)
    .not('resolved_by', 'is', null)
    .gte('resolved_at', currentMonthStart)

  const [
    openRes,
    channelRes,
    tierRes,
    statusRes,
    scoreDistRes,
    oldestRes,
    ownerRes,
    allScoresRes,
    rootCauseRes,
    b2bRes,
    responseCsatRes,
    timelineRes,
    openHighRes,
    performersRes,
  ] = await Promise.all([q0, q1, q2, q3, q4, q5, q6, q7, qRootCause, qB2b, qResponseCsat, qTimeline, qOpenHigh, qPerformers])

  const openRows = openRes.data || []
  const channelRows = channelRes.data || []
  const tierRows = tierRes.data || []
  const statusRows = statusRes.data || []
  const scoreRows = scoreDistRes.data || []
  const oldestCases = (oldestRes.data || []) as EscalationRow[]
  const ownerRows = ownerRes.data || []
  const allRows = allScoresRes.data || []
  const rootCauseRows = rootCauseRes.data || []
  const b2bRows = b2bRes.data || []
  const rcRows = responseCsatRes.data || []
  const timelineRows = timelineRes.data || []
  const openHighRows = (openHighRes.data || []) as EscalationRow[]
  const performerRows = performersRes.data || []

  const totalOpen = openRows.length
  const high = openRows.filter(r => r.priority_bucket === 'High').length
  const medium = openRows.filter(r => r.priority_bucket === 'Medium').length
  const low = openRows.filter(r => r.priority_bucket === 'Low').length
  const blocked = statusRows.filter(r => r.current_status === 'Blocked').length
  const slaBreach = allRows.filter(r => r.age_hours > (r.sla_hours || 24)).length
  const avgAge = totalOpen > 0 ? openRows.reduce((s, r) => s + (r.age_hours || 0), 0) / totalOpen : 0

  const byChannel = { WhatsApp: 0, Slack: 0, Email: 0 }
  channelRows.forEach(r => {
    if (r.channel in byChannel) byChannel[r.channel as keyof typeof byChannel]++
  })

  const byTier: Stats['byTier'] = { Enterprise: 0, 'Mid-Market': 0, SMB: 0 }
  tierRows.forEach(r => {
    if (r.account_tier in byTier) byTier[r.account_tier as keyof typeof byTier]++
  })

  const byStatus: Stats['byStatus'] = { Open: 0, Blocked: 0, 'In Progress': 0, Closed: 0 }
  statusRows.forEach(r => {
    if (r.current_status in byStatus) byStatus[r.current_status as keyof typeof byStatus]++
  })

  const scoreDistribution: Stats['scoreDistribution'] = {
    '0-30': 0, '31-45': 0, '46-60': 0, '61-70': 0, '71-85': 0, '86-100': 0
  }
  scoreRows.forEach(r => {
    const s = r.score || 0
    if (s <= 30) scoreDistribution['0-30']++
    else if (s <= 45) scoreDistribution['31-45']++
    else if (s <= 60) scoreDistribution['46-60']++
    else if (s <= 70) scoreDistribution['61-70']++
    else if (s <= 85) scoreDistribution['71-85']++
    else scoreDistribution['86-100']++
  })

  function avgScore(rows: Record<string, unknown>[], key: string, val: string) {
    const filtered = rows.filter(r => r[key] === val)
    if (!filtered.length) return 0
    return Math.round(filtered.reduce((s: number, r) => s + ((r.score as number) || 0), 0) / filtered.length)
  }

  const avgScoreBySegment: Stats['avgScoreBySegment'] = {
    Enterprise: avgScore(tierRows as Record<string, unknown>[], 'account_tier', 'Enterprise'),
    'Mid-Market': avgScore(tierRows as Record<string, unknown>[], 'account_tier', 'Mid-Market'),
    SMB: avgScore(tierRows as Record<string, unknown>[], 'account_tier', 'SMB'),
    WhatsApp: avgScore(channelRows as Record<string, unknown>[], 'channel', 'WhatsApp'),
    Slack: avgScore(channelRows as Record<string, unknown>[], 'channel', 'Slack'),
    Email: avgScore(channelRows as Record<string, unknown>[], 'channel', 'Email'),
  }

  function dimAvg(field: string) {
    const vals = openRows.map(r => (r as Record<string, number>)[field] || 0)
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0
  }

  const dimAverages: Stats['dimAverages'] = {
    business: dimAvg('dim_business'),
    timeAge: dimAvg('dim_time_age'),
    comms: dimAvg('dim_comms'),
    complexity: dimAvg('dim_complexity'),
    risk: dimAvg('dim_risk'),
    ownership: dimAvg('dim_ownership'),
    historical: dimAvg('dim_historical'),
  }

  function slaBreachPct(rows: typeof allRows, key: string, val: string) {
    const filtered = rows.filter((r: Record<string, unknown>) => r[key] === val)
    if (!filtered.length) return 0
    const breached = filtered.filter((r: Record<string, unknown>) => (r.age_hours as number) > ((r.sla_hours as number) || 24)).length
    return Math.round((breached / filtered.length) * 100)
  }

  const slaBreachBySegment: Stats['slaBreachBySegment'] = {
    Enterprise: slaBreachPct(allRows, 'account_tier', 'Enterprise'),
    'Mid-Market': slaBreachPct(allRows, 'account_tier', 'Mid-Market'),
    SMB: slaBreachPct(allRows, 'account_tier', 'SMB'),
    WhatsApp: slaBreachPct(allRows, 'channel', 'WhatsApp'),
    Slack: slaBreachPct(allRows, 'channel', 'Slack'),
    Email: slaBreachPct(allRows, 'channel', 'Email'),
  }

  // Ownership load
  const ownerMap: Record<string, { count: number; highCount: number }> = {}
  ownerRows.forEach(r => {
    const o = r.owner || '—'
    if (!ownerMap[o]) ownerMap[o] = { count: 0, highCount: 0 }
    ownerMap[o].count++
    if (r.priority_bucket === 'High') ownerMap[o].highCount++
  })
  const ownershipLoad = Object.entries(ownerMap)
    .map(([owner, { count, highCount }]) => ({ owner, count, highCount }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Root cause analysis
  const causeMap: Record<string, { count: number; totalResHours: number; b2bCount: number }> = {}
  rootCauseRows.forEach(r => {
    const cause = r.root_cause || 'Unknown'
    if (!causeMap[cause]) causeMap[cause] = { count: 0, totalResHours: 0, b2bCount: 0 }
    causeMap[cause].count++
    if (r.resolution_hours) causeMap[cause].totalResHours += r.resolution_hours
    if (r.b2b_or_b2c === 'B2B') causeMap[cause].b2bCount++
  })
  const rootCauseData = Object.entries(causeMap)
    .map(([cause, { count, totalResHours, b2bCount }]) => ({
      cause,
      count,
      avgResolutionHours: count > 0 ? Math.round(totalResHours / count) : 0,
      b2bPct: count > 0 ? Math.round((b2bCount / count) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)

  // B2B vs B2C
  const b2bCount = b2bRows.filter(r => r.b2b_or_b2c === 'B2B').length
  const b2cCount = b2bRows.filter(r => r.b2b_or_b2c === 'B2C').length
  const priorityB2bMap: Record<string, { b2b: number; b2c: number }> = {
    High: { b2b: 0, b2c: 0 },
    Medium: { b2b: 0, b2c: 0 },
    Low: { b2b: 0, b2c: 0 },
  }
  b2bRows.forEach(r => {
    const p = r.priority_bucket as string
    if (priorityB2bMap[p]) {
      if (r.b2b_or_b2c === 'B2B') priorityB2bMap[p].b2b++
      else if (r.b2b_or_b2c === 'B2C') priorityB2bMap[p].b2c++
    }
  })
  const byPriority = ['High', 'Medium', 'Low'].map(p => ({
    priority: p,
    b2b: priorityB2bMap[p].b2b,
    b2c: priorityB2bMap[p].b2c,
  }))

  // Response time & CSAT
  const lastMonthRcRows = rcRows.filter(r => r.created_at >= lastMonthStart && r.created_at < lastMonthEnd)
  const currentMonthRcRows = rcRows.filter(r => r.created_at >= currentMonthStart)
  function avgNum(rows: typeof rcRows, key: string) {
    const vals = rows.map(r => (r as Record<string, unknown>)[key] as number).filter(v => v != null && !isNaN(v))
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0
  }
  const responseCsat: Stats['responseCsat'] = {
    lastMonthAvgResponseHours: avgNum(lastMonthRcRows, 'first_response_hours'),
    currentMonthAvgResponseHours: avgNum(currentMonthRcRows, 'first_response_hours'),
    lastMonthCsat: avgNum(lastMonthRcRows.filter(r => r.current_status === 'Closed'), 'csat_score'),
    currentMonthCsat: avgNum(currentMonthRcRows.filter(r => r.current_status === 'Closed'), 'csat_score'),
  }

  // Tickets trend (last 6 months by month)
  const monthMap: Record<string, { raised: number; resolved: number }> = {}
  const sixMonthsAgo = new Date(now)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  timelineRows.forEach(r => {
    if (r.created_at) {
      const d = new Date(r.created_at)
      if (d >= sixMonthsAgo) {
        const key = d.toLocaleString('en-US', { month: 'short', year: '2-digit' })
        if (!monthMap[key]) monthMap[key] = { raised: 0, resolved: 0 }
        monthMap[key].raised++
      }
    }
    if (r.resolved_at) {
      const d = new Date(r.resolved_at)
      if (d >= sixMonthsAgo) {
        const key = d.toLocaleString('en-US', { month: 'short', year: '2-digit' })
        if (!monthMap[key]) monthMap[key] = { raised: 0, resolved: 0 }
        monthMap[key].resolved++
      }
    }
  })
  const ticketsTrend = Object.entries(monthMap)
    .sort((a, b) => {
      const da = new Date('1 ' + a[0].replace("'", ' 20'))
      const db = new Date('1 ' + b[0].replace("'", ' 20'))
      return da.getTime() - db.getTime()
    })
    .map(([period, { raised, resolved }]) => ({ period, raised, resolved }))

  // Top performers
  const perfMap: Record<string, { resolved: number; employeeId: string | null }> = {}
  performerRows.forEach(r => {
    const name = r.resolved_by || 'Unknown'
    if (!perfMap[name]) perfMap[name] = { resolved: 0, employeeId: r.employee_id }
    perfMap[name].resolved++
  })
  const topPerformers = Object.entries(perfMap)
    .map(([name, { resolved, employeeId }]) => ({ name, resolved, employeeId }))
    .sort((a, b) => b.resolved - a.resolved)
    .slice(0, 5)

  return {
    totalOpen,
    high,
    medium,
    low,
    blocked,
    slaBreach,
    avgAge,
    byChannel,
    byTier,
    byStatus,
    scoreDistribution,
    avgScoreBySegment,
    dimAverages,
    slaBreachBySegment,
    oldestCases,
    ownershipLoad,
    rootCauseData,
    b2bVsB2c: { b2bCount, b2cCount, byPriority },
    responseCsat,
    openHighPriorityForTimeline: openHighRows,
    ticketsTrend,
    topPerformers,
  }
}

export async function fetchEscalations(
  filters: FilterState
): Promise<{ data: GroupedAccount[]; count: number }> {
  let query = supabase.from('escalations').select('*', { count: 'exact' })

  if (filters.priority) query = query.eq('priority_bucket', filters.priority)
  if (filters.status) query = query.eq('current_status', filters.status)
  if (filters.channel) query = query.eq('channel', filters.channel)
  if (filters.tier) query = query.eq('account_tier', filters.tier)
  if (filters.owner) query = query.eq('owner', filters.owner)
  if (filters.b2bOrB2c) query = query.eq('b2b_or_b2c', filters.b2bOrB2c)
  if (filters.scoreRange) {
    query = query.gte('score', filters.scoreRange[0]).lte('score', filters.scoreRange[1])
  }
  if (filters.search) {
    query = query.or(
      `account_name.ilike.%${filters.search}%,ai_summary.ilike.%${filters.search}%`
    )
  }

  switch (filters.sortBy) {
    case 'score_desc': query = query.order('score', { ascending: false }); break
    case 'age_desc': query = query.order('age_hours', { ascending: false }); break
    case 'age_asc': query = query.order('age_hours', { ascending: true }); break
    case 'account_asc': query = query.order('account_name', { ascending: true }); break
  }

  const { data, count, error } = await query

  if (error) throw error

  const rows = (data || []) as EscalationRow[]

  // Group by account name
  const accountMap: Record<string, EscalationRow[]> = {}
  rows.forEach(row => {
    if (!accountMap[row.account_name]) accountMap[row.account_name] = []
    accountMap[row.account_name].push(row)
  })

  const grouped: GroupedAccount[] = Object.entries(accountMap).map(([name, escs]) => {
    const top = escs[0]
    const allFlags = Array.from(new Set(escs.flatMap(e => e.risk_flags || [])))
    return {
      name,
      escalations: escs,
      topScore: top.score,
      topPriority: top.priority_bucket,
      topStatus: top.current_status,
      topChannel: top.channel,
      topHint: top.priority_hint,
      riskFlags: allFlags,
      aiSummary: top.ai_summary,
    }
  })

  // Paginate grouped accounts
  const page = filters.page || 1
  const totalGroups = grouped.length
  const paginated = grouped.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return { data: paginated, count: totalGroups }
}

export async function fetchAccountEscalations(accountName: string): Promise<EscalationRow[]> {
  const { data, error } = await supabase
    .from('escalations')
    .select('*')
    .eq('account_name', accountName)
    .order('score', { ascending: false })

  if (error) throw error
  return (data || []) as EscalationRow[]
}

export async function fetchOwners(): Promise<string[]> {
  const { data } = await supabase
    .from('escalations')
    .select('owner')
    .neq('owner', '—')
    .neq('current_status', 'Closed')

  const owners = Array.from(new Set((data || []).map(r => r.owner))).filter(Boolean).sort() as string[]
  return owners
}

export async function fetchRecentEscalations(): Promise<{
  today: EscalationRow[]
  thisWeek: EscalationRow[]
  thisMonth: EscalationRow[]
}> {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const day = now.getDay()
  const weekDiff = now.getDate() - day + (day === 0 ? -6 : 1)
  const weekStart = new Date(now.getFullYear(), now.getMonth(), weekDiff).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [todayRes, weekRes, monthRes] = await Promise.all([
    supabase
      .from('escalations')
      .select('*')
      .gte('created_at', todayStart)
      .order('score', { ascending: false })
      .limit(10),
    supabase
      .from('escalations')
      .select('*')
      .gte('created_at', weekStart)
      .lt('created_at', todayStart)
      .order('score', { ascending: false })
      .limit(10),
    supabase
      .from('escalations')
      .select('*')
      .gte('created_at', monthStart)
      .lt('created_at', weekStart)
      .order('score', { ascending: false })
      .limit(10),
  ])

  return {
    today: (todayRes.data || []) as EscalationRow[],
    thisWeek: (weekRes.data || []) as EscalationRow[],
    thisMonth: (monthRes.data || []) as EscalationRow[],
  }
}
