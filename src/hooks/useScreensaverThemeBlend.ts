import { useEffect, useRef } from 'react'
import { useStore } from '../state/store'
import { presets } from '../state/themes'

/**
 * Manages theme crossfades while screensaver is active.
 * We generate a synthetic blended theme and set it to the store theme.
 */
export function useScreensaverThemeBlend() {
  const active = useStore(s => s.screensaverActive)
  const blendEnabled = useStore(s => s.screensaverBlendEnabled)
  const intervalMs = useStore(s => s.screensaverBlendIntervalMs)
  const theme = useStore(s => s.theme)
  const originalId = useStore(s => s._originalThemeId)
  const setTheme = useStore(s => s.setTheme)
  const setOverride = useStore(s => s.setBlendedThemeOverride)
  const override = useStore(s => s._blendedThemeOverride)
  const lastBlendRef = useRef<number>(0)
  const targetRef = useRef(presets[0])
  const fromRef = useRef(theme)

  // Pick a random different preset
  function pickNext(excludeId?: string) {
    const candidates = presets.filter(p => p.id !== excludeId)
    return candidates[Math.floor(Math.random() * candidates.length)]
  }

  useEffect(() => {
    if (!active || !blendEnabled) return
    fromRef.current = theme
    targetRef.current = pickNext(theme.id)
    lastBlendRef.current = performance.now()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, blendEnabled])

  useEffect(() => {
    if (!active || !blendEnabled) return
    let raf: number
    const tick = () => {
      const now = performance.now()
      if (now - lastBlendRef.current > intervalMs) {
        // Start a new blend
        fromRef.current = targetRef.current
        targetRef.current = pickNext(targetRef.current.id)
        lastBlendRef.current = now
      }
      // Blend progress (0..1)
      const t = Math.min(1, (now - lastBlendRef.current) / intervalMs)
      const f = fromRef.current
      const to = targetRef.current
      // simple linear color blend helper
      const lerpColor = (a: string, b: string) => {
        const ah = a.replace('#','')
        const bh = b.replace('#','')
        const ai = parseInt(ah,16)
        const bi = parseInt(bh,16)
        const ar = (ai>>16)&255, ag=(ai>>8)&255, ab=ai&255
        const br = (bi>>16)&255, bg=(bi>>8)&255, bb=bi&255
        const rr = Math.round(ar + (br-ar)*t)
        const rg = Math.round(ag + (bg-ag)*t)
        const rb = Math.round(ab + (bb-ab)*t)
        return '#'+((rr<<16)|(rg<<8)|rb).toString(16).padStart(6,'0')
      }
      const blended = {
        ...f,
        id: 'blend-active',
        name: 'Blended',
        description: 'Temporary screensaver blend',
        ui: {
          primary: lerpColor(f.ui.primary, to.ui.primary),
          accent: lerpColor(f.ui.accent, to.ui.accent),
          glow: lerpColor(f.ui.glow, to.ui.glow),
          bg: lerpColor(f.ui.bg, to.ui.bg)
        },
        visuals: {
          ...f.visuals,
          bloom: f.visuals.bloom + (to.visuals.bloom - f.visuals.bloom) * t,
          trails: f.visuals.trails || to.visuals.trails,
          lensflare: f.visuals.lensflare || to.visuals.lensflare,
          background: (t < 0.5 ? f.visuals.background : to.visuals.background),
          primaryShader: (t < 0.5 ? f.visuals.primaryShader : to.visuals.primaryShader),
          warpColor: to.visuals.warpColor || f.visuals.warpColor,
          hologramScanColor: to.visuals.hologramScanColor || f.visuals.hologramScanColor,
          gridColor: to.visuals.gridColor || f.visuals.gridColor,
          gridOpacity: (f.visuals as any).gridOpacity ?? (to.visuals as any).gridOpacity
        },
        dsp: {
          ambienceGain: f.dsp.ambienceGain + (to.dsp.ambienceGain - f.dsp.ambienceGain) * t,
          lowpassHz: f.dsp.lowpassHz + (to.dsp.lowpassHz - f.dsp.lowpassHz) * t
        }
      }
      if (!override || override !== blended) {
        setOverride(blended as any)
        setTheme(blended as any)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, blendEnabled, intervalMs, override, setOverride, setTheme])

  // Restore original theme on disable or deactivate
  useEffect(() => {
    if (!active || blendEnabled) return
    if (originalId) {
      const orig = presets.find(p => p.id === originalId)
      if (orig) setTheme(orig)
    }
    setOverride(null)
  }, [active, blendEnabled, originalId, setOverride, setTheme])
}