import React, { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../state/store'
import { normalizeSpeedForVisuals } from '../utils/gps'

export function WarpTunnel({ color = '#22D3EE' }: { color?: string }) {
  const group = React.useRef<THREE.Group>(null)
  const rings = useMemo(() => {
    const arr: THREE.Mesh[] = []
    const geo = new THREE.TorusGeometry(6, 0.05, 8, 64)
    for (let i = 0; i < 26; i++) {
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25 })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.rotation.x = Math.PI / 2
      mesh.position.z = -i * 3
      arr.push(mesh)
    }
    return arr
  }, [color])
  const speed = useStore(s => s.speed)

  useFrame((_, dt) => {
    const intensity = normalizeSpeedForVisuals(speed)
    rings.forEach(r => {
      r.position.z += (12 + intensity * 90) * dt
      if (r.position.z > 2) r.position.z = -78
      ;(r.material as THREE.MeshBasicMaterial).opacity = 0.15 + 0.55 * intensity
    })
  })

  return <group ref={group}>{rings.map((r, i) => <primitive key={i} object={r} />)}</group>
}