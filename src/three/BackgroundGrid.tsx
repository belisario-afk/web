import React, { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../state/store'

export function BackgroundGrid({ color = '#FFFFFF22' }: { color?: string }) {
  const lines = useMemo(() => {
    const group = new THREE.Group()
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5 })
    const size = 100
    const step = 2
    for (let i = -size; i <= size; i += step) {
      const geoH = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-size, -5, i),
        new THREE.Vector3(size, -5, i)
      ])
      const geoV = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(i, -5, -size),
        new THREE.Vector3(i, -5, size)
      ])
      group.add(new THREE.Line(geoH, material))
      group.add(new THREE.Line(geoV, material))
    }
    return group
  }, [color])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    lines.children.forEach((child, idx) => {
      const line = child as THREE.Line
      const baseOpacity = 0.25 + 0.25 * Math.sin(t * 0.5 + idx * 0.15)
      ;(line.material as THREE.LineBasicMaterial).opacity = baseOpacity
    })
  })

  return <primitive object={lines} />
}