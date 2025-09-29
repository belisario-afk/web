import React, { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useStore } from '../../state/store'

export const ScreensaverLogo: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null)
  const { gl } = useThree()
  const theme = useStore(s => s.theme)

  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader()
    const tex = loader.load('/web/screensaver/bat-opel.png', () => gl.invalidate())
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    return tex
  }, [gl])

  const mat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTex: { value: texture },
      uTime: { value: 0 },
      uPrimary: { value: new THREE.Color(theme.ui.primary) },
      uGlow: { value: new THREE.Color(theme.ui.glow) }
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
      uniform vec3 uPrimary;
      uniform vec3 uGlow;
      varying vec2 vUv;
      void main(){
        vec4 c = texture2D(uTex, vUv);
        if(c.a < 0.04) discard;
        float pulse = 0.55 + 0.45*sin(uTime*1.5);
        vec3 col = c.rgb;
        col += uGlow * pulse * 0.35;
        col = mix(col, uPrimary, 0.15);
        gl_FragColor = vec4(col, c.a);
      }
    `
  }), [texture, theme])

  useEffect(() => {
    ;(mat.uniforms.uPrimary.value as THREE.Color).set(theme.ui.primary)
    ;(mat.uniforms.uGlow.value as THREE.Color).set(theme.ui.glow)
  }, [theme, mat])

  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt
    if (meshRef.current) {
      meshRef.current.rotation.y += dt * 0.22
      meshRef.current.rotation.x = Math.sin(performance.now()*0.00025)*0.15
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0.5, 0]}>
      <planeGeometry args={[18, 8, 1, 1]} />
      <primitive attach="material" object={mat} />
    </mesh>
  )
}