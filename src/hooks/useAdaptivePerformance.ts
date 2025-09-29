import { useEffect, useRef, useState } from 'react'

/**
 * Monitors frame timing and signals when to degrade visuals.
 * degradeThresholdMs: average frame time above this => degrade (default 26ms ~ 38 FPS)
 * restoreThresholdMs: average frame time below this => restore (default 18ms ~ 55 FPS)
 */
export function useAdaptivePerformance(sampleSize = 45, degradeThresholdMs = 26, restoreThresholdMs = 18) {
  const times = useRef<number[]>([])
  const last = useRef(performance.now())
  const [degraded, setDegraded] = useState(false)

  useEffect(() => {
    let raf: number
    const loop = () => {
      const now = performance.now()
      const dt = now - last.current
      last.current = now
      times.current.push(dt)
      if (times.current.length > sampleSize) times.current.shift()
      const avg = times.current.reduce((a, b) => a + b, 0) / times.current.length
      if (!degraded && avg > degradeThresholdMs) setDegraded(true)
      else if (degraded && avg < restoreThresholdMs) setDegraded(false)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [degraded, sampleSize, degradeThresholdMs, restoreThresholdMs])

  return { degraded }
}