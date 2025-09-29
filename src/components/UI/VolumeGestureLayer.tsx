import React, { useEffect, useRef } from 'react'
import { useVolume } from '../../hooks/useVolume'

// Window-level two-finger vertical swipe to adjust volume.
// Does not block UI; listeners are attached to window.
export function VolumeGestureLayer() {
  const { bump } = useVolume()
  const trackingRef = useRef(false)
  const idsRef = useRef<number[]>([])
  const lastYRef = useRef<number>(0)
  const accumRef = useRef<number>(0)

  useEffect(() => {
    const getAvgY = (touches: TouchList, ids: number[]) => {
      const pts: number[] = []
      for (let i = 0; i < touches.length; i++) {
        const t = touches.item(i)!
        if (ids.includes(t.identifier)) pts.push(t.clientY)
      }
      if (pts.length < 2) return null
      return (pts[0] + pts[1]) / 2
    }

    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2 && !trackingRef.current) {
        trackingRef.current = true
        idsRef.current = [e.touches[0]!.identifier, e.touches[1]!.identifier]
        const avg = getAvgY(e.touches, idsRef.current)
        if (avg != null) {
          lastYRef.current = avg
          accumRef.current = 0
        }
      }
    }
    const onMove = (e: TouchEvent) => {
      if (!trackingRef.current) return
      if (e.touches.length < 2) {
        trackingRef.current = false
        return
      }
      const avg = getAvgY(e.touches, idsRef.current)
      if (avg == null) return
      const dy = lastYRef.current - avg // up = positive
      lastYRef.current = avg
      accumRef.current += dy
      // Apply in chunks for stability
      const threshold = 12 // px
      if (Math.abs(accumRef.current) >= threshold) {
        const delta = accumRef.current / 300 // full-screen swipe ~ 0.8–1.0
        bump(delta)
        accumRef.current = 0
      }
    }
    const onEnd = (e: TouchEvent) => {
      if (!trackingRef.current) return
      if (e.touches.length < 2) {
        trackingRef.current = false
        idsRef.current = []
        accumRef.current = 0
      }
    }

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    window.addEventListener('touchcancel', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart as any)
      window.removeEventListener('touchmove', onMove as any)
      window.removeEventListener('touchend', onEnd as any)
      window.removeEventListener('touchcancel', onEnd as any)
    }
  }, [bump])

  return null
}