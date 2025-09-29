import React, { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
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

function SceneContent() {
  const theme = useStore(s => s.theme)
  const speed = useStore(s => s.speed)
  const group = useRef<THREE.Group>(null)
  const intensity = useMemo(() => normalizeSpeedForVisuals(speed), [speed])

  const hologramMat =
    theme.visuals.primaryShader === 'hologram'
      ? useHologramMaterial(theme.ui.primary, theme.visuals.hologramScanColor || theme.ui.accent)
      : null

  const chromeMaterial = useMemo(() => {
    if (theme.visuals.primaryShader !== 'chrome') return null
    const envMap = new THREE.PMREMGenerator(new THREE.WebGLRenderer()).fromScene(new THREE.Scene())
    const mat = new THREE.MeshStandardMaterial({
      metalness: 1,
      roughness: 0.15,
      color: theme.ui.primary,
      emissive: new THREE.Color(theme.ui.glow).multiplyScalar(0.2)
    })
    ;(mat as any).envMapIntensity = 1.0
    return mat
  }, [theme])

  const wireMaterial = useMemo(() => {
    if (theme.visuals.primaryShader !== 'wire') return null
    return new THREE.MeshBasicMaterial({ color: theme.ui.primary, wireframe: true })
  }, [theme])

  useFrame((_, dt) => {
    if (group.current) {
      group.current.rotation.y += dt * (0.4 + intensity * 1.2) * 0.15
      group.current.rotation.x = Math.sin(performance.now() * 0.0003) * 0.2 * (0.3 + intensity)
    }
  })

  return (
    <>
      <color attach="background" args={[theme.ui.bg]} />
      {theme.visuals.background === 'stars' && (
        <Stars radius={80} depth={60} count={10000} factor={2} fade speed={0.5 + intensity * 0.8} />
      )}
      {theme.visuals.background === 'grid' && <BackgroundGrid color={theme.visuals.gridColor || '#FFFFFF10'} />}
      {theme.visuals.background === 'nebula' && (
        <Suspense fallback={null}>
          <Nebula colors={theme.visuals.nebulaColors} />
        </Suspense>
      )}
      {theme.visuals.background === 'warp' && <WarpTunnel color={theme.visuals.warpColor || theme.ui.accent} />}

      <group ref={group}>
        <Suspense fallback={null}>
          {theme.visuals.trails && <NeonTrails count={24} color={theme.ui.glow} />}
          {theme.visuals.lensflare && <LensFlares count={160} color={theme.ui.accent} />}
        </Suspense>
        <Text fontSize={3.4} position={[0, 0, 0]}>
          Z
          {theme.visuals.primaryShader === 'hologram' && hologramMat && (
            <primitive object={hologramMat} attach="material" />
          )}
          {theme.visuals.primaryShader === 'chrome' && chromeMaterial && (
            <primitive object={chromeMaterial} attach="material" />
          )}
          {theme.visuals.primaryShader === 'wire' && wireMaterial && (
            <primitive object={wireMaterial} attach="material" />
          )}
        </Text>
      </group>

      <ambientLight intensity={0.4 + intensity * 0.6} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color={theme.ui.accent} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color={theme.ui.glow} />
      {theme.visuals.environmentPreset && (
        <Suspense fallback={null}>
          <Environment preset={theme.visuals.environmentPreset as any} />
        </Suspense>
      )}
      <Effects bloom={theme.visuals.bloom} />
    </>
  )
}

export default function Dashboard3D() {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 15], fov: 60 }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <SceneContent />
    </Canvas>
  )
}