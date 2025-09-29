import { useCallback, useEffect, useState } from 'react'
import { useStore } from '../state/store'

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(document.fullscreenElement != null)
  const { fullscreenAuto } = useStore()

  const request = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      }
    } catch (e) {
      // ignore
    }
  }, [])

  const exit = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    }
  }, [])

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement != null)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  useEffect(() => {
    // Attempt on load (will be ignored without gesture on most browsers)
    if (fullscreenAuto) {
      setTimeout(() => {
        request()
      }, 200)
    }
  }, [fullscreenAuto, request])

  return { isFullscreen, request, exit }
}