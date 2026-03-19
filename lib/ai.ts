import type { EscalationRow } from '@/types'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

interface AIResult {
  summary: string
  action: string
  risk_flags: string[]
}

export async function generateAISummary(row: Partial<EscalationRow>): Promise<AIResult> {
  const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('Anthropic API key not configured')

  const prompt = `You are an escalation analyst for Plum Insurance.
Escalation message: ${row.message || 'No message provided'}
Account: ${row.account_name} (${row.account_tier})
Channel: ${row.channel}, Issue type: ${row.priority_hint || 'unknown'}
Return ONLY valid JSON — no markdown, no explanation:
{
  "summary": "2 sentence plain-English summary of the core issue",
  "action": "one of exactly: Unblock | Respond | Decision needed | Follow up",
  "risk_flags": ["churn and/or legal and/or social — only include if present"]
}`

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Anthropic API error: ${response.status} ${err}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text || '{}'

  try {
    const parsed = JSON.parse(text)
    return {
      summary: parsed.summary || '',
      action: parsed.action || 'Follow up',
      risk_flags: Array.isArray(parsed.risk_flags) ? parsed.risk_flags : [],
    }
  } catch {
    return { summary: text.slice(0, 200), action: 'Follow up', risk_flags: [] }
  }
}

export function getRuleBasedSummary(row: Partial<EscalationRow>): AIResult {
  const templates: Record<string, AIResult> = {
    escalation: {
      summary: `This ${row.account_tier} account has escalated a concern that requires immediate SVP attention. The issue has been flagged as high priority and needs swift resolution to maintain the account relationship.`,
      action: 'Decision needed',
      risk_flags: ['churn'],
    },
    critical: {
      summary: `A critical issue has been raised by ${row.account_name} that is blocking normal operations. Immediate intervention is required to prevent further impact to the account.`,
      action: 'Unblock',
      risk_flags: [],
    },
    'no response': {
      summary: `${row.account_name} has not received a response to their previous communication. This communication gap needs to be addressed urgently to maintain trust and service standards.`,
      action: 'Respond',
      risk_flags: ['churn'],
    },
    urgent: {
      summary: `An urgent matter has been raised by ${row.account_name} requiring prompt attention. The time-sensitive nature of this issue demands swift action to meet client expectations.`,
      action: 'Respond',
      risk_flags: [],
    },
    asap: {
      summary: `${row.account_name} has flagged an issue requiring as-soon-as-possible resolution. The client's expectation of rapid turnaround must be managed carefully to preserve the relationship.`,
      action: 'Follow up',
      risk_flags: [],
    },
    stuck: {
      summary: `Progress on ${row.account_name}'s request has stalled and requires intervention to unblock. The current blockage is causing frustration and needs coordinated resolution.`,
      action: 'Unblock',
      risk_flags: [],
    },
    delay: {
      summary: `There has been an unexpected delay in delivering services or information to ${row.account_name}. A clear timeline and updated communication plan is needed to restore confidence.`,
      action: 'Follow up',
      risk_flags: [],
    },
  }

  const hint = (row.priority_hint || '').toLowerCase()
  for (const [key, template] of Object.entries(templates)) {
    if (hint.includes(key)) return template
  }

  return {
    summary: `${row.account_name} has raised an issue that requires follow-up from the account management team. The matter should be reviewed and addressed in a timely manner.`,
    action: 'Follow up',
    risk_flags: [],
  }
}
