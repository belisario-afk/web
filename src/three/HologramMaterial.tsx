import * as THREE from 'three'
import React, { useMemo } from 'react'
import { extend, useFrame } from '@react-three/fiber'

class HologramShaderMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uBase: { value: new THREE.Color('#00e5ff') },
        uScan: { value: new THREE.Color('#ffffff') }
      },
      vertexShader: `
        varying vec3 vPos;
        void main(){
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uBase;
        uniform vec3 uScan;
        varying vec3 vPos;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(23.43,54.123)))*32423.123); }
        void main(){
          float scan = sin((vPos.y + uTime*4.0)*8.0)*0.5+0.5;
          float flick = step(0.965, hash(vec2(floor(vPos.x*6.0), floor((vPos.y+uTime)*32.0))));
          float grid = step(0.94, sin((vPos.x + uTime*0.5)*14.0))*0.25;
          vec3 col = uBase + scan * uScan * 0.9 + grid;
          col += flick * 0.5;
          float alpha = 0.70 + scan*0.25;
          gl_FragColor = vec4(col, alpha);
        }
      `
    })
  }
}
extend({ HologramShaderMaterial })

export function useHologramMaterial(base: string, scan: string) {
  const mat = useMemo(() => new HologramShaderMaterial(), [])
  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt
  })
  mat.uniforms.uBase.value.set(base)
  mat.uniforms.uScan.value.set(scan)
  return mat
}