import { useEffect, useRef, useState } from 'react'

/**
 * Tracks frame durations; provides performance tier + events for adaptive scaling.
 * Simple heuristic: if avg frame time > 28ms ( < ~36 FPS ) for N samples -> degrade.
 */
export function useAdaptivePerformance(sampleSize = 40) {
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
      if (!degraded && avg > 28) setDegraded(true)
      else if (degraded && avg < 20) setDegraded(false)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [degraded, sampleSize])

  return { degraded }
}