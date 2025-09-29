import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars, Text, Environment } from '@react-three/drei'
import { Effects } from '../three/Effects'
import { NeonTrails } from '../three/NeonTrails'
import { LensFlares } from '../three/LensFlares'
import { BackgroundGrid } from '../three/BackgroundGrid'
import { Nebula } from '../three/Nebula'
import { WarpTunnel } from '../three/WarpTunnel'
import { useStore } from '../state/store'
import { normalizeSpeedForVisuals } from '../utils/gps'
import * as THREE from 'three'
import { useHologramMaterial } from '../three/HologramMaterial'

/**
 * Defensive environment preset allowlist.
 */
const ENV_ALLOW = new Set([
  'city', 'sunset', 'dawn', 'night', 'forest', 'studio', 'warehouse', 'apartment', 'park'
])

function PrimaryZ() {
  const theme = useStore(s => s.theme)
  const speed = useStore(s => s.speed)
  const group = useRef<THREE.Group>(null)
  const intensity = useMemo(() => normalizeSpeedForVisuals(speed), [speed])

  const holoMat =
    theme.visuals.primaryShader === 'hologram'
      ? useHologramMaterial(theme.ui.primary, theme.visuals.hologramScanColor || theme.ui.accent)
      : null

  const chromeMat = useMemo(() => {
    if (theme.visuals.primaryShader !== 'chrome') return null
    return new THREE.MeshPhysicalMaterial({
      color: theme.ui.primary,
      metalness: 1,
      roughness: 0.2,
      clearcoat: 0.6,
      clearcoatRoughness: 0.1,
      emissive: new THREE.Color(theme.ui.glow).multiplyScalar(0.15)
    })
  }, [theme])

  const wireMat = useMemo(() => {
    if (theme.visuals.primaryShader !== 'wire') return null
    return new THREE.MeshBasicMaterial({ color: theme.ui.primary, wireframe: true })
  }, [theme])

  useFrame((_, dt) => {
    if (group.current) {
      group.current.rotation.y += dt * (0.3 + intensity * 0.9) * 0.25
      group.current.rotation.x = Math.sin(performance.now() * 0.00025) * 0.15 * (0.4 + intensity)
    }
  })

  const chosenMat = holoMat || chromeMat || wireMat

  return (
    <group ref={group}>
      <Text fontSize={3.4} position={[0, 0, 0]}>
        Z
        {chosenMat && <primitive attach="material" object={chosenMat} />}
      </Text>
    </group>
  )
}

function SceneContent() {
  const theme = useStore(s => s.theme)
  const speed = useStore(s => s.speed)
  const intensity = useMemo(() => normalizeSpeedForVisuals(speed), [speed])

  return (
    <>
      <color attach="background" args={[theme.ui.bg]} />
      {theme.visuals.background === 'stars' && (
        <Stars
          radius={90}
            depth={65}
            count={9000}
            factor={2}
            fade
            speed={0.4 + intensity * 0.7}
        />
      )}
      {theme.visuals.background === 'grid' && (
        <BackgroundGrid
          color={theme.visuals.gridColor || theme.ui.primary}
          opacity={('gridOpacity' in theme.visuals ? (theme.visuals as any).gridOpacity : 0.12) as number}
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
        {theme.visuals.trails && <NeonTrails count={24} color={theme.ui.glow} />}
        {theme.visuals.lensflare && <LensFlares count={140} color={theme.ui.accent} />}
      </Suspense>

      <PrimaryZ />

      <ambientLight intensity={0.35 + intensity * 0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color={theme.ui.accent} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color={theme.ui.glow} />

      {theme.visuals.environmentPreset &&
        ENV_ALLOW.has(theme.visuals.environmentPreset) && (
          <Suspense fallback={null}>
            <Environment preset={theme.visuals.environmentPreset as any} />
          </Suspense>
        )}

      <Effects bloom={theme.visuals.bloom} />
    </>
  )
}

function ContextLossGuard() {
  const { gl } = useThree()
  const [lost, setLost] = useState(false)

  useEffect(() => {
    const canvas = gl.domElement
    const onLost = (e: Event) => {
      e.preventDefault()
      setLost(true)
    }
    canvas.addEventListener('webglcontextlost', onLost, { passive: false })
    return () => canvas.removeEventListener('webglcontextlost', onLost as any)
  }, [gl])

  if (!lost) return null
  return (
    <group>
      {/* Could optionally show a fallback 2D overlay via portals. */}
    </group>
  )
}

export default function Dashboard3D() {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false
      }}
      camera={{ position: [0, 0, 15], fov: 60 }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <ContextLossGuard />
      <SceneContent />
    </Canvas>
  )
}