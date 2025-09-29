import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../../state/store'
import { useSpotify } from '../../providers/SpotifyProvider'

interface Props {
  count?: number
  radius?: number
}

export const BatsField: React.FC<Props> = ({ count = 160, radius = 34 }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const phases = useMemo(
    () => new Array(count).fill(0).map(() => ({
      phase: Math.random() * Math.PI * 2,
      speed: 0.25 + Math.random() * 0.65,
      flap: Math.random() * Math.PI * 2,
      flapSpeed: 3 + Math.random() * 5,
      radial: radius * (0.35 + Math.random() * 0.65),
      yOffset: (Math.random() - 0.5) * 10
    })),
    [count, radius]
  )
  const theme = useStore(s => s.theme)
  const { state } = useSpotify()

  // Music reactive energy proxy
  const lastPosRef = useRef<number | null>(null)
  const velRef = useRef(0)
  const energyRef = useRef(0)

  // Bat geometry: thicker stylized silhouette (two quads + central body)
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const verts = new Float32Array([
      // left wing
      0,0,0, -1.8,0.55,0, -1.8,-0.55,0,
      // right wing
      0,0,0,  1.8,-0.55,0, 1.8,0.55,0,
      // body tri (overlap)
      -0.25,0.8,0, 0.25,0.8,0, 0,-0.9,0
    ])
    g.setAttribute('position', new THREE.BufferAttribute(verts, 3))
    g.computeVertexNormals()
    return g
  }, [])

  const material = useMemo(() => new THREE.MeshBasicMaterial({
    color: theme.ui.primary,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }), [theme.ui.primary])

  useFrame((_, dt) => {
    // Compute energy proxy
    const pos = state?.position
    const dur = state?.duration
    if (typeof pos === 'number' && typeof dur === 'number' && dur > 0) {
      if (lastPosRef.current != null) {
        const delta = pos - lastPosRef.current
        velRef.current = delta
      }
      lastPosRef.current = pos
      // base energy from activity + minor random flicker
      const playingFactor = state?.paused ? 0.2 : 1
      const vel = Math.max(0, velRef.current)
      const targetEnergy = Math.min(1, vel / 850 + 0.15) * playingFactor
      energyRef.current += (targetEnergy - energyRef.current) * 0.08
    } else {
      energyRef.current += (0.1 - energyRef.current) * 0.05
    }

    const energy = energyRef.current

    if (!meshRef.current) return
    phases.forEach((b, i) => {
      b.phase += dt * b.speed * (0.6 + energy * 1.4)
      b.flap += dt * (b.flapSpeed + energy * 6)
      const x = Math.cos(b.phase) * b.radial
      const z = Math.sin(b.phase * 1.1) * b.radial
      const y = b.yOffset + Math.sin(b.phase * 1.8) * (1.6 + energy * 1.2)
      const flapScale = 0.9 + Math.sin(b.flap) * (0.45 + energy * 0.4)
      dummy.position.set(x, y, z)
      dummy.rotation.y = Math.atan2(-z, -x) + Math.PI
      dummy.rotation.z = Math.sin(b.flap * 0.45) * (0.35 + energy * 0.25)
      const scale = 1.6 + energy * 1.2
      dummy.scale.set(flapScale * scale, scale, scale)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
    ;(material.color as any).offsetHSL(0.0005, 0, 0) // gentle hue shift
    material.opacity = 0.65 + energy * 0.35
  })

  return (
    <instancedMesh ref={meshRef} args={[geom, material, count]} frustumCulled={false} />
  )
}