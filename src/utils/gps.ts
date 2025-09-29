import { clamp } from './math'

export type SpeedSample = { t: number; lat: number; lon: number }
export function haversineMeters(a: SpeedSample, b: SpeedSample) {
  const R = 6371000
  const toRad = (x: number) => (x * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLon = Math.sin(dLon / 2)
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  return R * c
}

/**
 * Basic median filter to reduce spikes.
 */
export function medianFilter(values: number[]) {
  if (values.length === 0) return 0
  const arr = [...values].sort((a, b) => a - b)
  const mid = Math.floor(arr.length / 2)
  return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2
}

export function normalizeSpeedForVisuals(mps: number) {
  // Map 0..50 m/s (0..180 km/h) to 0..1 with soft clamp
  const v = clamp(mps / 50, 0, 1)
  return v
}