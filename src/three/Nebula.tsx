import React, { useMemo } from 'react'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

export function Nebula({ colors = ['#ff7b00', '#ff00aa', '#00e5ff'] }: { colors?: string[] }) {
  const count = 6000
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = Math.random() * 40
      const theta = Math.random() * Math.PI * 2
      const y = (Math.random() - 0.5) * 10
      arr[i * 3 + 0] = Math.cos(theta) * r
      arr[i * 3 + 1] = y
      arr[i * 3 + 2] = Math.sin(theta) * r
    }
    return arr
  }, [count])

  const colorArray = useMemo(() => colors.map(c => new THREE.Color(c)), [colors])
  const materialRef = React.useRef<PointMaterial>(null)

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.size = 0.2 + 0.05 * Math.sin(clock.elapsedTime * 2.0)
    }
  })

  return (
    <group>
      <Points positions={positions} stride={3} frustumCulled>
        <PointMaterial
          ref={materialRef}
          size={0.18}
          transparent
          depthWrite={false}
          vertexColors={false}
          color={colorArray[0]}
        />
      </Points>
    </group>
  )
}