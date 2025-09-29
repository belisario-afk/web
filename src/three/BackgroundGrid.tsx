import React, { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

interface Props {
  color?: string
  opacity?: number
}
export function BackgroundGrid({ color = '#ffffff', opacity = 0.15 }: Props) {
  const group = useMemo(() => {
    const g = new THREE.Group()
    const size = 100
    const step = 2
    for (let i = -size; i <= size; i += step) {
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity })
      const geoH = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-size, -5, i),
        new THREE.Vector3(size, -5, i)
      ])
      const geoV = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(i, -5, -size),
        new THREE.Vector3(i, -5, size)
      ])
      g.add(new THREE.Line(geoH, mat))
      g.add(new THREE.Line(geoV, mat))
    }
    return g
  }, [color, opacity])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    group.children.forEach((child, idx) => {
      const line = child as THREE.Line
      const base = opacity * 0.6
      ;(line.material as THREE.LineBasicMaterial).opacity =
        base + base * 0.4 * Math.sin(t * 0.4 + idx * 0.1)
    })
  })

  return <primitive object={group} />
}