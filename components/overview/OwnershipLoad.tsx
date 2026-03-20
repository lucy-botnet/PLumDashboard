'use client'

import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import type { Stats } from '@/types'

interface Props {
  owners: Stats['ownershipLoad']
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function LoadPips({ count, isUnassigned }: { count: number; isUnassigned: boolean }) {
  if (isUnassigned) return null
  const isHeavy = count > 40
  const pips = [
    isHeavy ? '#FBBF24' : '#34D399',
    isHeavy ? '#FBBF24' : 'rgba(255,255,255,0.12)',
    'rgba(255,255,255,0.12)',
  ]
  return (
    <div className="flex items-center gap-1">
      {pips.map((color, i) => (
        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color }} />
      ))}
      <span style={{ fontSize: 12, fontWeight: 500, color: '#C4C0D8', marginLeft: 4, fontFamily: 'Inter, sans-serif' }}>
        {count}
      </span>
    </div>
  )
}

export default function OwnershipLoad({ owners }: Props) {
  const router = useRouter()
  const { setFilter, owner: activeOwner } = useAppStore()

  return (
    <div className="card-lift" style={{ background: '#161932', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', padding: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
      <div className="flex justify-between items-center mb-3">
        <span style={{ fontWeight: 500, fontSize: 12, color: '#8B85AA', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif' }}>
          Ownership load
        </span>
        <span style={{ fontSize: 11, color: '#6B65AA', fontFamily: 'Inter, sans-serif' }}>high priority only</span>
      </div>

      {owners.map((item, i) => {
        const isUnassigned = item.owner === '—'
        const isActive = !activeOwner || activeOwner === item.owner
        const isOOO = item.owner.includes('(OOO)')
        const cleanName = item.owner.replace(' (OOO)', '')

        return (
          <div
            key={item.owner}
            className="flex items-center gap-2 cursor-pointer transition-colors py-2"
            style={{
              borderBottom: i < owners.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              opacity: isActive ? 1 : 0.35,
            }}
            onClick={() => {
              if (activeOwner === item.owner) {
                setFilter('owner', null)
              } else {
                setFilter('owner', item.owner)
                router.push('/dashboard/detail')
              }
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
          >
            {/* Avatar */}
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: isUnassigned ? 'rgba(248,113,113,0.2)' : 'rgba(167,139,250,0.2)',
                color: isUnassigned ? '#F87171' : '#A78BFA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: 10,
                flexShrink: 0,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {isUnassigned ? '!' : getInitials(cleanName)}
            </div>

            {/* Name + count */}
            <div style={{ flex: 1 }}>
              <div className="flex items-center">
                <span style={{ fontWeight: 500, fontSize: 12, color: '#E8E6F0', fontFamily: 'Inter, sans-serif' }}>
                  {cleanName}
                </span>
                {isOOO && (
                  <span style={{ fontSize: 10, color: '#F87171', marginLeft: 4, fontFamily: 'Inter, sans-serif' }}>
                    (OOO)
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#6B65AA', fontFamily: 'Inter, sans-serif' }}>
                {item.count} open · {item.highCount} high
              </div>
            </div>

            {/* Load indicator */}
            {isUnassigned ? (
              <span style={{ fontSize: 11, fontWeight: 500, color: '#F87171', fontFamily: 'Inter, sans-serif' }}>
                Assign now
              </span>
            ) : (
              <LoadPips count={item.count} isUnassigned={false} />
            )}
          </div>
        )
      })}

      {owners.length === 0 && (
        <div style={{ textAlign: 'center', color: '#6B65AA', fontSize: 12, padding: '20px 0', fontFamily: 'Inter, sans-serif' }}>
          No ownership data
        </div>
      )}
    </div>
  )
}
