import React, { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

export function ProceduralSky({
  top = '#0A0F14',
  middle = '#112e45',
  bottom = '#0A0F14',
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
          varying vec3 vDir;
          void main(){
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vDir;
          uniform vec3 uTop;
          uniform vec3 uMid;
          uniform vec3 uBot;
          uniform vec3 uSun;
          uniform float uTime;
          void main(){
            float h = vDir.y * 0.5 + 0.5;
            vec3 base = mix(uBot, uTop, smoothstep(0.0,1.0,h));
            base = mix(base, uMid, 0.28 + 0.18*sin(uTime*0.05));
            float sun = pow(max(0.0, 1.0 - length(vDir.xz)), 6.0);
            base += uSun * sun * 0.45;
            gl_FragColor = vec4(base, 1.0);
          }
        `
      }),
    [top, middle, bottom, sunColor]
  )

  useFrame((_, dt) => {
    material.uniforms.uTime.value += dt
  })

  return (
    <mesh scale={180}>
      <sphereGeometry args={[1, 40, 40]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}