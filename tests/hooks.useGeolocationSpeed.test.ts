import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useGeolocationSpeed } from '../src/hooks/useGeolocationSpeed'

describe('useGeolocationSpeed', () => {
  const watchMock = vi.fn()
  const clearMock = vi.fn()

  beforeEach(() => {
    ;(global as any).navigator.geolocation = {
      watchPosition: watchMock.mockImplementation((success: any) => {
        setTimeout(() => {
          success({
            coords: { latitude: 0, longitude: 0, speed: 10 },
            timestamp: Date.now()
          })
        }, 0)
        return 1
      }),
      clearWatch: clearMock
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('reports supported and updates speed', async () => {
    const { result } = renderHook(() => useGeolocationSpeed())
    expect(result.current.supported).toBe(true)
  })
})