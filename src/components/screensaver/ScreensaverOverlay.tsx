// Only change here: swap any previous BatsField import path if it changed.
// Ensure this overlay exists already; snippet shows the important part.

import React from 'react'
import { Canvas } from '@react-three/fiber'
import { ScreensaverLogo } from './ScreensaverLogo'
import { BatsField } from './BatsField'
import { useStore } from '../../state/store'
import { OverlayHUD } from './OverlayHUD'

export const ScreensaverOverlay: React.FC = () => {
  const active = useStore(s => s.screensaverActive)
  const setActive = useStore(s => s.setScreensaverActive)
  if (!active) return null
  return (
    <div className="fixed inset-0 z-[2200] bg-black">
      <Canvas
        dpr={[1,2]}
        camera={{ position:[0,4,40], fov:50 }}
        gl={{ antialias:true, powerPreference:'high-performance' }}
      >
        <color attach="background" args={['#000']} />
        <ambientLight intensity={0.35} />
        <pointLight position={[10,14,12]} intensity={1.2} color={'white'} />
        <ScreensaverLogo />
        <BatsField />
      </Canvas>
      <OverlayHUD />
      <button
        onClick={()=>setActive(false)}
        className="absolute top-6 right-6 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white text-sm backdrop-blur-md"
      >
        Exit
      </button>
      <div className="absolute left-6 bottom-6 text-white/40 text-xs">
        Press F to cycle formation
      </div>
    </div>
  )
}