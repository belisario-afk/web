import { useEffect, useRef } from 'react'

type GestureHandlers = {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onTap?: () => void
}

export function useGestures(el: HTMLElement | null, handlers: GestureHandlers) {
  const startX = useRef(0)
  const startY = useRef(0)
  const startT = useRef(0)
  const moved = useRef(false)

  useEffect(() => {
    if (!el) return
    const minDist = 48
    const maxTime = 600

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0]
      startX.current = t.clientX
      startY.current = t.clientY
      startT.current = performance.now()
      moved.current = false
    }
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0]
      const dx = t.clientX - startX.current
      const dy = t.clientY - startY.current
      moved.current = Math.hypot(dx, dy) > 10
    }
    const onTouchEnd = (e: TouchEvent) => {
      const dt = performance.now() - startT.current
      if (dt > maxTime) return
      if (e.changedTouches.length === 0) return
      const t = e.changedTouches[0]
      const dx = t.clientX - startX.current
      const dy = t.clientY - startY.current
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minDist) {
        if (dx < 0) handlers.onSwipeLeft?.()
        else handlers.onSwipeRight?.()
      } else if (Math.abs(dy) > minDist && dy < 0) {
        handlers.onSwipeUp?.()
      } else if (!moved.current) {
        handlers.onTap?.()
      }
    }
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [el, handlers])
}