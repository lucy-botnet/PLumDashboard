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
  const barColor = pct > 90 ? '#DC2626' : '#D97706'
  return (
    <div
      className="flex items-center gap-2 mb-2 cursor-pointer rounded transition-colors px-1"
      onClick={onClick}
      style={{ opacity: isActive === false ? 0.4 : 1 }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = '#FDFCFF')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
    >
      <span style={{ fontWeight: 400, fontSize: 12, color: '#1A0A2B', width: 80, flexShrink: 0, fontFamily: 'Inter, sans-serif' }}>
        {label}
      </span>
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height: 6, backgroundColor: '#F3F4F6' }}
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
    <div className="card-lift" style={{ background: 'white', borderRadius: 12, border: '1px solid #EDE8FD', padding: 20, boxShadow: '0 1px 4px rgba(115,8,227,0.06)' }}>
      <div className="mb-3">
        <span style={{ fontWeight: 500, fontSize: 12, color: '#9E94BC', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif' }}>
          SLA breach by segment
        </span>
      </div>

      <div style={{ fontWeight: 400, fontSize: 10, color: '#9E94BC', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Inter, sans-serif', marginBottom: 6 }}>
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

      <div style={{ height: 1, backgroundColor: '#EDE8FD', margin: '12px 0' }} />

      <div style={{ fontWeight: 400, fontSize: 10, color: '#9E94BC', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Inter, sans-serif', marginBottom: 6 }}>
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
