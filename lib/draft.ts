import type { EscalationRow } from '@/types'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

export async function generateDraftReply(
  escalation: EscalationRow,
  prefix?: string
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('Anthropic API key not configured')

  const prefixText = prefix ? `${prefix}\n\n` : ''

  const prompt = `${prefixText}You are writing on behalf of Avik Bhandari, SVP Account Management at Plum Insurance.
Write a professional, empathetic, action-oriented reply to this escalation.
Account: ${escalation.account_name} (${escalation.account_tier}), Channel: ${escalation.channel}, Issue: ${escalation.priority_hint || 'general'}
Summary: ${escalation.ai_summary || 'No summary available'}
Rules: Max 150 words. No bullet points. Warm but authoritative tone.
End with: Warm regards, Avik Bhandari, SVP Account Management, Plum Insurance
Return ONLY the email body text. No subject line. No JSON.`

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
  return data.content?.[0]?.text || ''
}
