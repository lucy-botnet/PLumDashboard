'use client'

import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import type { Stats } from '@/types'

interface Props {
  data: Stats['slaBreachBySegment']
}

interface HorizBarProps {
  label: string
  pct: number
  onClick: () => void
  isActive: boolean
}

function HorizBar({ label, pct, onClick, isActive }: HorizBarProps) {
  const barColor = pct > 90 ? '#F87171' : '#FBBF24'
  return (
    <div
      className="flex items-center gap-2 mb-2 cursor-pointer rounded transition-colors px-1"
      onClick={onClick}
      style={{ opacity: isActive === false ? 0.35 : 1 }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
    >
      <span style={{ fontWeight: 400, fontSize: 12, color: '#C4C0D8', width: 80, flexShrink: 0, fontFamily: 'Inter, sans-serif' }}>
        {label}
      </span>
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.08)' }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            backgroundColor: barColor,
            borderRadius: 999,
            transition: 'width 600ms ease-out',
          }}
        />
      </div>
      <span style={{ fontWeight: 500, fontSize: 11, color: barColor, width: 32, textAlign: 'right', fontFamily: 'Inter, sans-serif' }}>
        {pct}%
      </span>
    </div>
  )
}

export default function SlaBreachBars({ data }: Props) {
  const { setFilter, tier: activeTier, channel: activeChannel } = useAppStore()
  const router = useRouter()

  return (
    <div className="card-lift" style={{ background: '#161932', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', padding: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
      <div className="mb-3">
        <span style={{ fontWeight: 500, fontSize: 12, color: '#8B85AA', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif' }}>
          SLA breach by segment
        </span>
      </div>

      <div style={{ fontWeight: 400, fontSize: 10, color: '#6B65AA', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Inter, sans-serif', marginBottom: 6 }}>
        By tier
      </div>

      {[
        { label: 'Enterprise', val: data.Enterprise, filterKey: 'tier' as const },
        { label: 'Mid-Market', val: data['Mid-Market'], filterKey: 'tier' as const },
        { label: 'SMB', val: data.SMB, filterKey: 'tier' as const },
      ].map(item => (
        <HorizBar
          key={item.label}
          label={item.label}
          pct={item.val}
          onClick={() => {
            if (activeTier === item.label) setFilter('tier', null)
            else { setFilter('tier', item.label); router.push('/dashboard/detail') }
          }}
          isActive={!activeTier || activeTier === item.label}
        />
      ))}

      <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />

      <div style={{ fontWeight: 400, fontSize: 10, color: '#6B65AA', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Inter, sans-serif', marginBottom: 6 }}>
        By channel
      </div>

      {[
        { label: 'WhatsApp', val: data.WhatsApp, filterKey: 'channel' as const },
        { label: 'Slack', val: data.Slack, filterKey: 'channel' as const },
        { label: 'Email', val: data.Email, filterKey: 'channel' as const },
      ].map(item => (
        <HorizBar
          key={item.label}
          label={item.label}
          pct={item.val}
          onClick={() => {
            if (activeChannel === item.label) setFilter('channel', null)
            else { setFilter('channel', item.label); router.push('/dashboard/detail') }
          }}
          isActive={!activeChannel || activeChannel === item.label}
        />
      ))}
    </div>
  )
}
