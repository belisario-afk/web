import React, { useEffect, useRef } from 'react'
import { useStore } from '../../state/store'
import { useBattery } from '../../hooks/useBattery'
import { useGeolocationSpeed } from '../../hooks/useGeolocationSpeed'
import { mpsToKph } from '../../utils/math'

/**
 * Lightweight 2D HUD inside screensaver (absolute positioned),
 * cycles through clock / battery / route when mode changes.
 */
export const OverlayHUD: React.FC = () => {
  const mode = useStore(s => s.screensaverMode)
  const theme = useStore(s => s.theme)
  const { level } = useBattery()
  const { speed } = useGeolocationSpeed()
  const route = useStore(s => s.routePositions)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Draw whenever dependencies change
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    c.width = c.clientWidth * dpr
    c.height = c.clientHeight * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0,0,c.clientWidth,c.clientHeight)

    ctx.font = '600 42px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.lineJoin = 'round'

    if (mode === 'clock') {
      const now = new Date()
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      ctx.fillStyle = theme.ui.primary
      ctx.fillText(time, c.clientWidth/2, c.clientHeight/2)
    } else if (mode === 'battery') {
      const pct = level != null ? Math.round(level * 100) : null
      ctx.strokeStyle = theme.ui.accent
      ctx.lineWidth = 10
      const radius = 90
      ctx.beginPath()
      ctx.arc(c.clientWidth/2, c.clientHeight/2, radius, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'
      ctx.stroke()
      if (pct != null) {
        ctx.beginPath()
        ctx.strokeStyle = theme.ui.primary
        ctx.arc(c.clientWidth/2, c.clientHeight/2, radius, -Math.PI/2, -Math.PI/2 + Math.PI*2*(pct/100))
        ctx.stroke()
        ctx.fillStyle = theme.ui.glow
        ctx.font = '600 40px system-ui'
        ctx.fillText(pct + '%', c.clientWidth/2, c.clientHeight/2 + 14)
      } else {
        ctx.fillStyle = theme.ui.primary
        ctx.font = '600 32px system-ui'
        ctx.fillText('Battery N/A', c.clientWidth/2, c.clientHeight/2 + 12)
      }
    } else if (mode === 'route') {
      // Draw route polyline centered
      if (route.length >= 3) {
        const xs = route.map(p => p.x)
        const ys = route.map(p => p.y)
        const minX = Math.min(...xs), maxX = Math.max(...xs)
        const minY = Math.min(...ys), maxY = Math.max(...ys)
        const w = maxX - minX || 1
        const h = maxY - minY || 1
        const pad = 40
        const scale = Math.min(
          (c.clientWidth - pad*2) / w,
          (c.clientHeight - pad*2) / h
        )
        ctx.strokeStyle = theme.ui.primary
        ctx.lineWidth = 4
        ctx.beginPath()
        route.forEach((p, i) => {
          const dx = (p.x - minX) * scale + pad
            const dy = (p.y - minY) * scale + pad
          if (i === 0) ctx.moveTo(dx, dy)
          else ctx.lineTo(dx, dy)
        })
        ctx.stroke()
        // Endpoint marker
        const last = route[route.length-1]
        const lx = (last.x - minX)*scale + pad
        const ly = (last.y - minY)*scale + pad
        ctx.fillStyle = theme.ui.accent
        ctx.beginPath()
        ctx.arc(lx, ly, 8, 0, Math.PI*2)
        ctx.fill()
      } else {
        ctx.fillStyle = theme.ui.primary
        ctx.font = '600 28px system-ui'
        ctx.fillText('Gathering route...', c.clientWidth/2, c.clientHeight/2 + 10)
      }
      ctx.fillStyle = theme.ui.glow
      ctx.font = '500 24px system-ui'
      ctx.fillText(`${Math.round(mpsToKph(speed))} km/h`, c.clientWidth/2, c.clientHeight - 32)
    } else {
      // logo mode: show subtle hint
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.font = '500 18px system-ui'
      ctx.fillText('Tap to change mode', c.clientWidth/2, c.clientHeight - 28)
    }
  }, [mode, theme, level, route, speed])

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="w-[320px] h-[240px] sm-tablet:w-[420px] sm-tablet:h-[300px]"
        style={{ mixBlendMode: 'plus-lighter' }}
      />
    </div>
  )
}