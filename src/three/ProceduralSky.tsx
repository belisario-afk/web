import React, { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

/**
 * Lightweight procedural gradient "sky dome" – replaces heavy HDR fetches.
 * Color stops are blended in shader; single draw, no texture IO.
 */
export function ProceduralSky({
  top = '#0a1b2f',
  middle = '#112e45',
  bottom = '#1d3b55',
  sunColor = '#ffaa55'
}: {
  top?: string
  middle?: string
  bottom?: string
  sunColor?: string
}) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uTop: { value: new THREE.Color(top) },
          uMid: { value: new THREE.Color(middle) },
          uBot: { value: new THREE.Color(bottom) },
          uSun: { value: new THREE.Color(sunColor) },
          uTime: { value: 0 }
        },
        vertexShader: `
          varying vec3 vPos;
          void main() {
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vPos;
          uniform vec3 uTop;
          uniform vec3 uMid;
          uniform vec3 uBot;
          uniform vec3 uSun;
          uniform float uTime;
          void main(){
            float h = normalize(vPos).y * 0.5 + 0.5;
            vec3 grad = mix(uBot, uTop, smoothstep(0.0,1.0,h));
            grad = mix(grad, uMid, 0.35 + 0.35*sin(uTime*0.05));
            // simple sun-ish glow at horizon angle
            float sun = pow(max(0.0, 1.0 - length(normalize(vPos).xz)), 8.0);
            grad += uSun * sun * 0.55;
            gl_FragColor = vec4(grad,1.0);
          }
        `
      }),
    [top, middle, bottom, sunColor]
  )

  useFrame((_, dt) => {
    material.uniforms.uTime.value += dt
  })

  return <mesh scale={200}><sphereGeometry args={[1, 48, 48]} /><primitive attach="material" object={material} /></mesh>
}