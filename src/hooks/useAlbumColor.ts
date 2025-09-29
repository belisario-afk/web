import { useEffect, useState } from 'react'
import { useSpotify } from '../providers/SpotifyProvider'

/**
 * Extracts a rough dominant color from the current track's largest album image.
 * Downscales to 12x12 and averages (ignores pure black pixels to avoid bias if artwork has black borders).
 * Returns hex string (#RRGGBB).
 */
export function useAlbumColor(pollMs = 2000) {
  const { state } = useSpotify()
  const [color, setColor] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let interval: number | null = null

    async function sample() {
      try {
        const url = state?.track_window.current_track?.album?.images?.[0]?.url
        if (!url) return
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.decoding = 'async'
        img.src = url
        await img.decode().catch(() => {})
        if (cancelled) return
        const size = 12
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = size
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return
        ctx.drawImage(img, 0, 0, size, size)
        const data = ctx.getImageData(0, 0, size, size).data
        let r = 0, g = 0, b = 0, c = 0
        for (let i = 0; i < data.length; i += 4) {
          const R = data[i], G = data[i + 1], B = data[i + 2], A = data[i + 3]
            // ignore near transparent or nearly black pixels
          if (A < 40) continue
          if (R < 8 && G < 8 && B < 8) continue
          r += R; g += G; b += B; c++
        }
        if (c === 0) return
        r = Math.round(r / c)
        g = Math.round(g / c)
        b = Math.round(b / c)
        const hex = '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')
        setColor(hex)
      } catch {
        // ignore
      }
    }

    sample()
    interval = window.setInterval(sample, pollMs)
    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
    }
  }, [state, pollMs])

  return color
}