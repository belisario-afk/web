import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

interface Props {
  count?: number
  radius?: number
  color?: string
}

export const BatsField: React.FC<Props> = ({ count = 60, radius = 26, color = '#111' }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const phases = useMemo(
    () => new Array(count).fill(0).map(() => ({
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.6,
      flap: Math.random() * Math.PI * 2,
      flapSpeed: 4 + Math.random() * 4,
      radial: radius * (0.4 + Math.random() * 0.6),
      yOffset: (Math.random() - 0.5) * 8
    })),
    [count, radius]
  )

  // Simple "bat" geometry: two thin triangles
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    // 6 vertices (2 triangles)
    const verts = new Float32Array([
      0,0,0,  -0.6,0.15,0,  -0.6,-0.15,0,
      0,0,0,   0.6,-0.15,0,  0.6,0.15,0
    ])
    g.setAttribute('position', new THREE.BufferAttribute(verts, 3))
    g.computeVertexNormals()
    return g
  }, [])

  const material = useMemo(() => new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  }), [color])

  useFrame((_, dt) => {
    if (!meshRef.current) return
    phases.forEach((b, i) => {
      b.phase += dt * b.speed * 0.2
      b.flap += dt * b.flapSpeed
      const x = Math.cos(b.phase) * b.radial
      const z = Math.sin(b.phase * 1.15) * b.radial
      const y = b.yOffset + Math.sin(b.phase * 1.7) * 1.2
      const flapScale = 0.8 + Math.sin(b.flap) * 0.35
      dummy.position.set(x, y, z)
      dummy.rotation.y = Math.atan2(-z, -x) + Math.PI // face inward
      dummy.rotation.z = Math.sin(b.flap * 0.5) * 0.25
      dummy.scale.set(flapScale, 1, 1)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[geom, material, count]} frustumCulled={false} />
  )
}