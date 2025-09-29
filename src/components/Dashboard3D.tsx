import React, { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, Stars, Text, OrbitControls } from '@react-three/drei'
import { Effects } from '../three/Effects'
import { NeonTrails } from '../three/NeonTrails'
import { LensFlares } from '../three/LensFlares'
import { useStore } from '../state/store'
import { normalizeSpeedForVisuals } from '../utils/gps'
import * as THREE from 'three'

function SceneContent() {
  const theme = useStore(s => s.theme)
  const speed = useStore(s => s.speed)
  const group = useRef<THREE.Group>(null)

  const intensity = useMemo(() => normalizeSpeedForVisuals(speed), [speed])

  useFrame((_, dt) => {
    if (group.current) {
      group.current.rotation.y += dt * (0.05 + intensity * 0.2)
      group.current.rotation.x = Math.sin(performance.now() * 0.0003) * 0.05
    }
  })

  return (
    <>
      <color attach="background" args={[theme.ui.bg]} />
      <Stars radius={80} depth={50} count={10000} factor={2} fade speed={0.5} />
      <group ref={group}>
        <Suspense fallback={null}>
          {theme.visuals.trails && <NeonTrails count={24} color={theme.ui.glow} />}
          {theme.visuals.lensflare && <LensFlares count={160} color={theme.ui.accent} />}
        </Suspense>
        <Text fontSize={3.4} color={theme.ui.primary} position={[0, 0, 0]}>
          Z
          <meshStandardMaterial emissive={theme.ui.glow} emissiveIntensity={1.2 + intensity} />
        </Text>
      </group>
      <ambientLight intensity={0.6 + intensity * 0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color={theme.ui.accent} />
      <Effects bloom={theme.visuals.bloom} />
      {/* Developer control: disable OrbitControls in production if not desired */}
      {/* <OrbitControls enablePan={false} enableZoom={false} /> */}
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