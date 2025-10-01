import React from 'react'
import { Canvas } from '@react-three/fiber'
import { ScreensaverLogo } from './ScreensaverLogo'
import { useStore } from '../../state/store'
import { OverlayHUD } from './OverlayHUD'

/**
 * Simplified screensaver:
 *  - Only central rotating emblem (ScreensaverLogo)
 *  - Retains HUD (clock / battery / route modes still cycle if user selects)
 *  - No bat swarm, no formation cycling
 */
export const ScreensaverOverlay: React.FC = () => {
  const active = useStore(s => s.screensaverActive)
  const setActive = useStore(s => s.setScreensaverActive)
  if (!active) return null

  return (
    <div className="fixed inset-0 z-[2200] bg-black">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 2.5, 28], fov: 50 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#000']} />
        <ambientLight intensity={0.45} />
        <pointLight position={[8, 10, 10]} intensity={1.3} color={'white'} />
        <ScreensaverLogo />
      </Canvas>

      <OverlayHUD />

      <button
        onClick={() => setActive(false)}
        className="absolute top-6 right-6 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white text-sm backdrop-blur-md"
      >
        Exit
      </button>

      <div className="absolute left-6 bottom-6 text-white/40 text-xs">
        Screensaver (Emblem Only)
      </div>
    </div>
  )
}