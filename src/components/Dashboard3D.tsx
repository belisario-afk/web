import React, { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { Effects } from '../three/Effects'
import { NeonTrails } from '../three/NeonTrails'
import { LensFlares } from '../three/LensFlares'
import { BackgroundGrid } from '../three/BackgroundGrid'
import { Nebula } from '../three/Nebula'
import { WarpTunnel } from '../three/WarpTunnel'
import { ProceduralSky } from '../three/ProceduralSky'
import { useStore } from '../state/store'
import { normalizeSpeedForVisuals } from '../utils/gps'
import { useAdaptivePerformance } from '../hooks/useAdaptivePerformance'
import { OpelZLogo } from './visual/OpelZLogo'

function Scene() {
  const theme = useStore(s => s.theme)
  const speed = useStore(s => s.speed)
  const intensity = normalizeSpeedForVisuals(speed)
  const { degraded } = useAdaptivePerformance()
  const particleScale = degraded ? 0.45 : 1

  const hologram = theme.visuals.primaryShader === 'hologram'

  return (
    <>
      <color attach="background" args={[theme.ui.bg]} />
      <ProceduralSky
        top={theme.ui.bg}
        middle={theme.ui.accent}
        bottom={theme.ui.bg}
        sunColor={theme.ui.primary}
      />
      {theme.visuals.background === 'stars' && (
        <Stars
          radius={75}
          depth={55}
          count={Math.round((theme.visuals.particles || 3000) * particleScale * 0.5)}
          factor={2}
          fade
          speed={0.25 + intensity * 0.5}
        />
      )}
      {theme.visuals.background === 'grid' && (
        <BackgroundGrid
          color={(theme.visuals as any).gridColor || theme.ui.primary}
          opacity={(theme.visuals as any).gridOpacity ?? 0.1}
        />
      )}
      {theme.visuals.background === 'nebula' && (
        <Suspense fallback={null}>
          <Nebula colors={theme.visuals.nebulaColors} />
        </Suspense>
      )}
      {theme.visuals.background === 'warp' && (
        <WarpTunnel color={theme.visuals.warpColor || theme.ui.accent} />
      )}

      <Suspense fallback={null}>
        {theme.visuals.trails && !degraded && (
          <NeonTrails count={20} color={theme.ui.glow} />
        )}
        {theme.visuals.lensflare && !degraded && (
          <LensFlares count={110} color={theme.ui.accent} />
        )}
      </Suspense>

      <OpelZLogo hologram={hologram} rotationSpeed={0.2} />

      <ambientLight intensity={0.3 + intensity * 0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} color={theme.ui.accent} />
      <pointLight position={[-10, -10, -6]} intensity={0.3} color={theme.ui.glow} />
      <Effects bloom={degraded ? theme.visuals.bloom * 0.5 : theme.visuals.bloom} />
    </>
  )
}

function CanvasWrapper() {
  const [lost, setLost] = useState(false)
  return (
    <>
      <Canvas
        key={lost ? 'reinit' : 'main'}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false
        }}
        camera={{ position: [0, 0, 15], fov: 60 }}
        style={{ position: 'absolute', inset: 0 }}
        onCreated={({ gl }) => {
          const canvas = gl.domElement
          canvas.addEventListener(
            'webglcontextlost',
            (e) => {
              e.preventDefault()
              setLost(true)
            },
            { passive: false }
          )
        }}
      >
        {!lost && <Scene />}
      </Canvas>
      {lost && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 text-white gap-5">
          <div className="text-lg font-semibold">Graphics context lost</div>
          <button
            onClick={() => setLost(false)}
            className="px-5 py-3 rounded-xl bg-opel-neon text-black font-semibold"
          >
            Reinitialize
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-md border border-white/30 text-white/80 text-sm"
          >
            Full reload
          </button>
        </div>
      )}
    </>
  )
}

export default function Dashboard3D() {
  return <CanvasWrapper />
}