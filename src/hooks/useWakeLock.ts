import { useEffect, useRef, useState } from 'react'

export function useWakeLock() {
  const [active, setActive] = useState(false)
  const [fallbackActive, setFallbackActive] = useState(false)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<ConstantSourceNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  // Screen Wake Lock API with auto-reacquire
  useEffect(() => {
    let released = false
    const request = async () => {
      try {
        // @ts-ignore
        const wl = await navigator.wakeLock?.request?.('screen')
        wakeLockRef.current = wl || null
        if (wl) {
          wl.addEventListener('release', () => {
            if (!released) {
              setActive(false)
              request().catch(() => {})
            }
          })
          setActive(true)
        } else {
          // If API not available, start fallback
          startSilentAudio()
        }
      } catch {
        startSilentAudio()
      }
    }
    request().catch(() => startSilentAudio())
    const onVis = () => {
      if (document.visibilityState === 'visible' && wakeLockRef.current == null) {
        request().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      released = true
      document.removeEventListener('visibilitychange', onVis)
      wakeLockRef.current?.release().catch(() => {})
      stopSilentAudio()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Silent audio fallback: truly silent constant source into gain 0
  const startSilentAudio = () => {
    try {
      if (audioCtxRef.current) return
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioCtxRef.current = ctx
      const src = new ConstantSourceNode(ctx, { offset: 0 })
      const gain = ctx.createGain()
      gain.gain.value = 0 // fully silent
      src.connect(gain).connect(ctx.destination)
      src.start()
      sourceRef.current = src
      gainRef.current = gain
      setFallbackActive(true)
    } catch {
      // ignore
    }
  }

  const stopSilentAudio = () => {
    try {
      sourceRef.current?.stop()
    } catch {}
    gainRef.current?.disconnect()
    audioCtxRef.current?.close().catch(() => {})
    sourceRef.current = null
    gainRef.current = null
    audioCtxRef.current = null
    setFallbackActive(false)
  }

  return { active, fallbackActive }
}