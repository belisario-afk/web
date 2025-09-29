import React, { useMemo, useRef } from 'react'
import { Line } from '@react-three/drei'
import { Group } from 'three'

export function NeonTrails({ count = 20, color = '#00E5FF' }: { count?: number; color?: string }) {
  const group = useRef<Group>(null)
  const lines = useMemo(() => {
    const arr: { points: [number, number, number][]; width: number }[] = []
    for (let i = 0; i < count; i++) {
      const points: [number, number, number][] = []
      const radius = 3 + Math.random() * 7
      for (let a = 0; a < Math.PI * 2; a += 0.2) {
        points.push([Math.cos(a) * radius, Math.sin(a * 2) * 0.5, Math.sin(a) * radius])
      }
      arr.push({ points, width: 0.2 + Math.random() * 0.4 })
    }
    return arr
  }, [count])

  return (
    <group ref={group}>
      {lines.map((l, i) => (
        <Line
          key={i}
          points={l.points}
          color={color}
          lineWidth={l.width}
          opacity={0.8}
          transparent
        />
      ))}
    </group>
  )
}