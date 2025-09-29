import React, { useMemo } from 'react'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

export function Nebula({ colors }: { colors?: string[] }) {
  const palette = colors && colors.length ? colors : ['#ff7b00', '#ff00aa', '#00e5ff', '#7dffcb']
  const count = 5000
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = Math.random() * 45
      const theta = Math.random() * Math.PI * 2
      const y = (Math.random() - 0.5) * 14
      arr[i * 3 + 0] = Math.cos(theta) * r
      arr[i * 3 + 1] = y
      arr[i * 3 + 2] = Math.sin(theta) * r
    }
    return arr
  }, [count])
  const materialRef = React.useRef<PointMaterial>(null)
  const paletteColors = useMemo(() => palette.map(c => new THREE.Color(c)), [palette])
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.size = 0.18 + 0.05 * Math.sin(clock.elapsedTime * 1.5)
      // (Optional palette shift: omitted for performance)
    }
  })
  return (
    <group>
      <Points positions={positions} stride={3} frustumCulled>
        <PointMaterial
          ref={materialRef}
          size={0.2}
          transparent
          depthWrite={false}
          vertexColors={false}
          color={paletteColors[0]}
          opacity={0.75}
        />
      </Points>
    </group>
  )
}