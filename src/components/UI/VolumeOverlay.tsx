import React, { useMemo } from 'react'
import { useStore } from '../../state/store'

export function VolumeOverlay() {
  const volume = useStore(s => s.volume)
  const last = useStore(s => s.lastVolumeChangeAt)

  const visible = useMemo(() => {
    if (!last) return false
    return Date.now() - last < 1200
  }, [last])

  if (!visible) return null

  const pct = Math.round(volume * 100)

  return (
    <div className="pointer-events-none fixed bottom-[calc(24px+var(--safe-bottom))] left-1/2 -translate-x-1/2 z-[1000]">
      <div className="px-4 py-3 rounded-2xl bg-black/70 backdrop-blur-md border border-white/15 min-w-[220px]">
        <div className="text-white/90 text-sm mb-2 text-center">Volume {pct}%</div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#39FF14,#00E0FF)' }}
          />
        </div>
      </div>
    </div>
  )
}