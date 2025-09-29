import { useEffect, useRef } from 'react'
import { useStore } from '../state/store'

/**
 * Hook that monitors global user input to trigger screensaver after inactivity.
 */
export function useInactivityScreensaver() {
  const timeoutMs = useStore(s => s.screensaverTimeoutMs)
  const lastInteractionAt = useStore(s => s.lastInteractionAt)
  const screensaverActive = useStore(s => s.screensaverActive)
  const setScreensaverActive = useStore(s => s.setScreensaverActive)
  const markInteraction = useStore(s => s.markInteraction)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const handler = () => {
      if (screensaverActive) {
        // Any interaction exits screensaver.
        setScreensaverActive(false)
      }
      markInteraction()
    }
    const events: (keyof GlobalEventHandlersEventMap)[] = [
      'pointerdown','pointermove','keydown','wheel','touchstart','touchmove'
    ]
    events.forEach(e => window.addEventListener(e, handler, { passive: true }))
    return () => events.forEach(e => window.removeEventListener(e, handler))
  }, [screensaverActive, setScreensaverActive, markInteraction])

  useEffect(() => {
    const loop = () => {
      const now = Date.now()
      if (!screensaverActive && now - lastInteractionAt >= timeoutMs) {
        setScreensaverActive(true)
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [screensaverActive, lastInteractionAt, timeoutMs, setScreensaverActive])

  // Keyboard shortcut 's' toggles.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 's') {
        setScreensaverActive(!screensaverActive)
      } else if (e.key === 'Escape' && screensaverActive) {
        setScreensaverActive(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [screensaverActive, setScreensaverActive])
}