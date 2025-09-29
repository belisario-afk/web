import React, { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { BatsField } from './BatsField'
import { ScreensaverLogo } from './ScreensaverLogo'
import { useStore } from '../../state/store'
import { OverlayHUD } from './OverlayHUD'
import { useScreensaverThemeBlend } from '../../hooks/useScreensaverThemeBlend'

export const ScreensaverOverlay: React.FC = () => {
  const active = useStore(s => s.screensaverActive)
  const setActive = useStore(s => s.setScreensaverActive)
  const mode = useStore(s => s.screensaverMode)
  const setMode = useStore(s => s.setScreensaverMode)
  const autoMs = useStore(s => s.screensaverAutoCycleMs)
  const lastModeSwitchRef = useRef<number>(Date.now())

  useScreensaverThemeBlend()

  // Auto-cycle modes
  useEffect(() => {
    if (!active) return
    let raf: number
    const cycle = () => {
      const now = Date.now()
      if (now - lastModeSwitchRef.current > autoMs) {
        const order: typeof mode[] = ['logo','clock','battery','route']
        const idx = order.indexOf(mode)
        const next = order[(idx + 1) % order.length]
        setMode(next)
        lastModeSwitchRef.current = now
      }
      raf = requestAnimationFrame(cycle)
    }
    raf = requestAnimationFrame(cycle)
    return () => cancelAnimationFrame(raf)
  }, [active, mode, setMode, autoMs])

  // Tap anywhere to advance
  useEffect(() => {
    if (!active) return
    const onClick = () => {
      const order: typeof mode[] = ['logo','clock','battery','route']
      const idx = order.indexOf(mode)
      setMode(order[(idx + 1) % order.length])
      lastModeSwitchRef.current = Date.now()
    }
    window.addEventListener('pointerdown', onClick)
    return () => window.removeEventListener('pointerdown', onClick)
  }, [active, mode, setMode])

  if (!active) return null
  return (
    <div
      className="fixed inset-0 z-[2200] bg-black"
      style={{ animation: 'fadeInScreensaver 0.7s ease forwards' }}
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 4, 40], fov: 50 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#000']} />
        <ambientLight intensity={0.35} />
        <pointLight position={[10, 14, 12]} intensity={1.4} color={'white'} />
        <ScreensaverLogo />
        <BatsField />
      </Canvas>
      <OverlayHUD />

      <button
        onClick={() => setActive(false)}
        className="absolute top-6 right-6 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white text-sm backdrop-blur-md"
      >
        Exit
      </button>
      <div className="absolute left-6 bottom-6 text-white/40 text-xs font-medium space-y-1">
        <div>Mode: {mode.toUpperCase()} (tap to cycle)</div>
        <div>Blending themes enabled</div>
      </div>
      <style>{`
        @keyframes fadeInScreensaver {
          from { opacity:0 }
          to { opacity:1 }
        }
      `}</style>
    </div>
  )
}