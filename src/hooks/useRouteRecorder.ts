import { useEffect } from 'react'
import { useStore } from '../state/store'
import { useGeolocationSpeed } from './useGeolocationSpeed'

export function useRouteRecorder() {
  const { rawCoords } = useGeolocationSpeed() as any // ensure your hook exposes rawCoords { latitude, longitude }
  const push = useStore(s => s.pushRoutePoint)

  useEffect(() => {
    if (!rawCoords) return
    // Simple mercator-ish scaling for small local area
    const { latitude, longitude } = rawCoords
    const x = longitude * 111320 * Math.cos(latitude * Math.PI / 180) / 1000
    const y = latitude * 110540 / 1000
    push(x, y)
  }, [rawCoords, push])
}