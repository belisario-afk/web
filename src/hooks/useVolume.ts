import { useCallback, useEffect } from 'react'
import { useStore } from '../state/store'
import { useSpotify } from '../providers/SpotifyProvider'

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

export function useVolume() {
  const volume = useStore(s => s.volume)
  const setVolumeLocal = useStore(s => s.setVolume)
  const mark = useStore(s => s.markVolumeChanged)
  const { setVolume: setVolumeSDK, getVolume } = useSpotify()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        if (getVolume) {
          const v = await getVolume()
          if (!cancelled && typeof v === 'number' && !Number.isNaN(v)) {
            setVolumeLocal(clamp01(v))
          }
        }
      } catch {}
    })()
    return () => {
      cancelled = true
    }
  }, [getVolume, setVolumeLocal])

  const applyVolume = useCallback(async (next: number) => {
    const v = clamp01(next)
    setVolumeLocal(v)
    mark()
    try {
      await setVolumeSDK(v)
    } catch {
      // ignore
    }
  }, [mark, setVolumeLocal, setVolumeSDK])

  const bump = useCallback((delta: number) => {
    applyVolume(volume + delta)
  }, [applyVolume, volume])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const code = e.code || ''
      const key = (e.key || '').toLowerCase()
      if (code === 'AudioVolumeUp' || key === 'volumeup') {
        e.preventDefault()
        bump(0.05)
      } else if (code === 'AudioVolumeDown' || key === 'volumedown') {
        e.preventDefault()
        bump(-0.05)
      }
    }
    window.addEventListener('keydown', onKey, { passive: false })
    return () => window.removeEventListener('keydown', onKey as any)
  }, [bump])

  return {
    volume,
    setVolume: applyVolume,
    bump
  }
}