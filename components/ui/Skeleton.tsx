export function SkeletonCard() {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 12,
        border: '1px solid #E5E7EB',
        padding: '16px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <div className="flex justify-between items-start">
        <div style={{ flex: 1 }}>
          <div
            className="animate-pulse"
            style={{ height: 14, width: '40%', backgroundColor: '#F3F4F6', borderRadius: 6, marginBottom: 8 }}
          />
          <div
            className="animate-pulse"
            style={{ height: 11, width: '70%', backgroundColor: '#F3F4F6', borderRadius: 6, marginBottom: 6 }}
          />
          <div
            className="animate-pulse"
            style={{ height: 11, width: '55%', backgroundColor: '#F3F4F6', borderRadius: 6 }}
          />
        </div>
        <div>
          <div
            className="animate-pulse"
            style={{ height: 32, width: 48, backgroundColor: '#F3F4F6', borderRadius: 6, marginBottom: 6 }}
          />
          <div
            className="animate-pulse"
            style={{ height: 20, width: 56, backgroundColor: '#F3F4F6', borderRadius: 20 }}
          />
        </div>
      </div>
      <div
        className="animate-pulse mt-3 pt-3"
        style={{ borderTop: '1px solid #F3F4F6' }}
      >
        <div className="flex gap-2">
          {[80, 60, 70, 90].map((w, i) => (
            <div key={i} style={{ height: 18, width: w, backgroundColor: '#F3F4F6', borderRadius: 20 }} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function SkeletonKpi() {
  return (
    <div
      className="animate-pulse px-6 flex flex-col justify-center"
      style={{ height: 80 }}
    >
      <div style={{ height: 36, width: 80, backgroundColor: '#F3F4F6', borderRadius: 6, marginBottom: 6 }} />
      <div style={{ height: 12, width: 64, backgroundColor: '#F3F4F6', borderRadius: 4 }} />
    </div>
  )
}

interface SkeletonCardsProps {
  count?: number
}

export function SkeletonCards({ count = 6 }: SkeletonCardsProps) {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
