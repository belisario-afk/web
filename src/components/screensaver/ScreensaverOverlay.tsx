import React from 'react'
import { Canvas } from '@react-three/fiber'
import { BatsField } from './BatsField'
import { ScreensaverLogo } from './ScreensaverLogo'
import { useStore } from '../../state/store'

export const ScreensaverOverlay: React.FC = () => {
  const active = useStore(s => s.screensaverActive)
  const setActive = useStore(s => s.setScreensaverActive)
  if (!active) return null
  return (
    <div
      className="fixed inset-0 z-[2000] bg-black transition-opacity duration-600"
      style={{ animation: 'fadeInScreensaver 0.8s ease forwards' }}
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 2, 24], fov: 50 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance'
        }}
      >
        <color attach="background" args={['#000']} />
        <ambientLight intensity={0.4} />
        <pointLight position={[8, 10, 10]} intensity={1.2} color={'#ffffff'} />
        <ScreensaverLogo />
        <BatsField />
      </Canvas>

      <button
        onClick={() => setActive(false)}
        className="absolute top-6 right-6 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white text-sm backdrop-blur-md"
      >
        Exit Screensaver
      </button>
      <style>{`
        @keyframes fadeInScreensaver {
          from { opacity:0 }
          to { opacity:1 }
        }
      `}</style>
    </div>
  )
}