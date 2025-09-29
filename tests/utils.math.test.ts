import { describe, it, expect } from 'vitest'
import { clamp, lerp, smoothDamp, mpsToKph, kphToMps } from '../src/utils/math'

describe('math utils', () => {
  it('clamp', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(99, 0, 10)).toBe(10)
  })
  it('lerp', () => {
    expect(lerp(0, 10, 0)).toBe(0)
    expect(lerp(0, 10, 0.5)).toBe(5)
    expect(lerp(0, 10, 1)).toBe(10)
  })
  it('smoothDamp moves toward target', () => {
    const next = smoothDamp(0, 1, 5, 0.016)
    expect(next).toBeGreaterThan(0)
    expect(next).toBeLessThan(1)
  })
  it('speed conversions', () => {
    expect(mpsToKph(10)).toBeCloseTo(36)
    expect(kphToMps(72)).toBeCloseTo(20)
  })
})