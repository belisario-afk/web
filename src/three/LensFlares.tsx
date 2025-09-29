import React, { useMemo } from 'react'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

export function LensFlares({ count = 100, color = '#FFFFFF' }: { count?: number; color?: string }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 30
      arr[i * 3 + 1] = (Math.random() - 0.5) * 5
      arr[i * 3 + 2] = (Math.random() - 0.5) * 30
    }
    return arr
  }, [count])

  return (
    <Points positions={positions} stride={3} frustumCulled>
      <PointMaterial size={0.12} color={new THREE.Color(color)} transparent fog />
    </Points>
  )
}