import React, { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, Text } from '@react-three/drei'
import { Effects } from '../three/Effects'
import { NeonTrails } from '../three/NeonTrails'
import { LensFlares } from '../three/LensFlares'
import { BackgroundGrid } from '../three/BackgroundGrid'
import { Nebula } from '../three/Nebula'
import { WarpTunnel } from '../three/WarpTunnel'
import { ProceduralSky } from '../three/ProceduralSky'
import { useStore } from '../state/store'
import * as THREE from 'three'
import { normalizeSpeedForVisuals } from '../utils/gps'
import { useHologramMaterial } from '../three/HologramMaterial'
import { useAdaptivePerformance } from '../hooks/useAdaptivePerformance'

function PrimaryZ({ degraded }: { degraded: boolean }) {
  const theme = useStore(s => s.theme)
  const speed = useStore(s => s.speed)
  const group = useRef<THREE.Group>(null)
  const intensity = useMemo(() => normalizeSpeedForVisuals(speed), [speed])

  const holo =
    theme.visuals.primaryShader === 'hologram'
      ? useHologramMaterial(theme.ui.primary, theme.visuals.hologramScanColor || theme.ui.accent)
      : null

  const chrome = useMemo(() => {
    if (theme.visuals.primaryShader !== 'chrome') return null
    return new THREE.MeshStandardMaterial({
      color: theme.ui.primary,
      metalness: 1,
      roughness: 0.25,
      emissive: new THREE.Color(theme.ui.glow).multiplyScalar(0.12)
    })
  }, [theme])

  const wire = useMemo(() => {
    if (theme.visuals.primaryShader !== 'wire') return null
    return new THREE.MeshBasicMaterial({ color: theme.ui.primary, wireframe: true })
  }, [theme])

  useFrame((_, dt) => {
    if (group.current) {
      group.current.rotation.y += dt * (0.25 + intensity * 0.9)
      group.current.rotation.x = Math.sin(performance.now() * 0.0002) * 0.18 * (0.4 + intensity)
    }
  })

  const mat = holo || chrome || wire
  return (
    <group ref={group}>
      <Text fontSize={degraded ? 2.9 : 3.4} position={[0, 0, 0]}>
        Z
        {mat && <primitive attach="material" object={mat} />}
      </Text>
    </group>
  )
}

function SceneContent() {
  const theme = useStore(s => s.theme)
  const { degraded } = useAdaptivePerformance()
  const speed = useStore(s => s.speed)
  const intensity = normalizeSpeedForVisuals(speed)
  const particleScale = degraded ? 0.5 : 1

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
          radius={80}
          depth={60}
          count={Math.round((theme.visuals.particles || 3000) * particleScale * 0.6)}
          factor={2}
          fade
          speed={0.3 + intensity * 0.6}
        />
      )}
      {theme.visuals.background === 'grid' && (
        <BackgroundGrid
          color={(theme.visuals as any).gridColor || theme.ui.primary}
          opacity={(theme.visuals as any).gridOpacity ?? 0.12}
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
          <NeonTrails count={24} color={theme.ui.glow} />
        )}
        {theme.visuals.lensflare && !degraded && (
          <LensFlares count={140} color={theme.ui.accent} />
        )}
      </Suspense>

      <PrimaryZ degraded={degraded} />

      <ambientLight intensity={0.35 + intensity * 0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.2} color={theme.ui.accent} />
      <pointLight position={[-10, -10, -5]} intensity={0.4} color={theme.ui.glow} />

      <Effects bloom={degraded ? theme.visuals.bloom * 0.6 : theme.visuals.bloom} />
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
          failIfMajorPerformanceCaveat: false,
          preserveDrawingBuffer: false
        }}
        camera={{ position: [0, 0, 15], fov: 60 }}
        style={{ position: 'absolute', inset: 0 }}
        onCreated={({ gl }) => {
          const canvas = gl.domElement
            ;(canvas as any).addEventListener(
            'webglcontextlost',
            (e: Event) => {
              e.preventDefault()
              setLost(true)
            },
            { passive: false }
          )
        }}
      >
        <SceneContent />
      </Canvas>
      {lost && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 text-white gap-4">
          <div className="text-lg font-semibold">Graphics context lost</div>
          <button
            className="px-5 py-3 rounded-xl bg-opel-neon text-black font-semibold"
            onClick={() => setLost(false)}
          >
            Reinitialize 3D
          </button>
        </div>
      )}
    </>
  )
}

export default function Dashboard3D() {
  return <CanvasWrapper />
}