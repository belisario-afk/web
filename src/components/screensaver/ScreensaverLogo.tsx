import React, { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'

/**
 * Rotating central bat-opel logo with emissive pulse.
 * Expects image at /screensaver/bat-opel.png (public path).
 */
export const ScreensaverLogo: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null)
  const { gl } = useThree()
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader()
    const tex = loader.load('/web/screensaver/bat-opel.png', () => {
      gl.invalidate()
    })
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    return tex
  }, [gl])

  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uTex: { value: texture },
      uTime: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uTex;
      uniform float uTime;
      varying vec2 vUv;
      void main(){
        vec4 c = texture2D(uTex, vUv);
        if(c.a < 0.04) discard;
        float glow = 0.5 + 0.5 * sin(uTime*2.0) ;
        c.rgb += glow * 0.35 * vec3(1.0, 1.0, 1.0);
        gl_FragColor = vec4(c.rgb, c.a);
      }
    `
  }), [texture])

  useFrame((_, dt) => {
    if (material.uniforms.uTime) material.uniforms.uTime.value += dt
    if (meshRef.current) {
      meshRef.current.rotation.y += dt * 0.25
      meshRef.current.rotation.x = Math.sin(performance.now()*0.0003)*0.15
    }
  })

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[14, 6.2, 1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}