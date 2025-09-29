import { useEffect, useRef, useState } from 'react'
import { haversineMeters, medianFilter } from '../utils/gps'
import { smoothDamp } from '../utils/math'

export function useGeolocationSpeed() {
  const [supported, setSupported] = useState(false)
  const [speed, setSpeed] = useState(0) // m/s smoothed
  const [rawSpeed, setRawSpeed] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const history = useRef<{ t: number; lat: number; lon: number }[]>([])
  const speedWindow = useRef<number[]>([])
  const lastUpdate = useRef(performance.now())
  const [active, setActive] = useState(false)

  useEffect(() => {
    setSupported('geolocation' in navigator)
    if (!('geolocation' in navigator)) return

    const watch = navigator.geolocation.watchPosition(
      (pos) => {
        setActive(true)
        const { latitude, longitude, speed: s } = pos.coords
        const t = pos.timestamp
        const sample = { t, lat: latitude, lon: longitude }
        const arr = history.current
        arr.push(sample)
        if (arr.length > 5) arr.shift()

        let vMps = 0
        if (typeof s === 'number' && !Number.isNaN(s)) {
          vMps = Math.max(0, s)
        } else if (arr.length >= 2) {
          const a = arr[arr.length - 2]
          const b = arr[arr.length - 1]
          const dt = (b.t - a.t) / 1000
          const d = haversineMeters(a, b)
          vMps = dt > 0 ? d / dt : 0
        }
        speedWindow.current.push(vMps)
        if (speedWindow.current.length > 7) speedWindow.current.shift()
        const med = medianFilter(speedWindow.current)
        const now = performance.now()
        const dt = (now - lastUpdate.current) / 1000
        lastUpdate.current = now
        setRawSpeed(vMps)
        setSpeed((cur) => smoothDamp(cur, med, 2.5, dt))
      },
      (err) => {
        setError(err.message)
        setActive(false)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 500,
        timeout: 10000
      }
    )

    return () => navigator.geolocation.clearWatch(watch)
  }, [])

  return { supported, active, speed, rawSpeed, error }
}