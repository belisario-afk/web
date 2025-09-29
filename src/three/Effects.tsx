import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import React from 'react'

export function Effects({ bloom = 1.2 }: { bloom?: number }) {
  return (
    <EffectComposer multisampling={8}>
      <Bloom intensity={bloom} luminanceThreshold={0.2} luminanceSmoothing={0.9} />
      <Vignette eskil={false} offset={0.2} darkness={0.8} />
    </EffectComposer>
  )
}