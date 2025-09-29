import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../../state/store'
import batLogoUrl from '../../assets/bat-opel.png' // ensure file exists

export const ScreensaverLogo: React.FC = () => {
  const theme = useStore(s => s.theme)
  const meshRef = useRef<THREE.Mesh>(null)

  const material = useMemo(() => {
    const texLoader = new THREE.TextureLoader()
    const tex = texLoader.load(
      batLogoUrl,
      undefined,
      undefined,
      () => {
        // On error: create a fallback solid texture
        const c = document.createElement('canvas')
        c.width = c.height = 64
        const ctx = c.getContext('2d')!
        ctx.fillStyle = '#111'
        ctx.fillRect(0,0,64,64)
        ctx.fillStyle = '#fff'
        ctx.fillText('Z', 26, 38)
        const fallback = new THREE.CanvasTexture(c)
        ;(material.uniforms.uTex.value as THREE.Texture) = fallback
      }
    )
    tex.colorSpace = THREE.SRGBColorSpace
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTex: { value: tex },
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
          float pulse = 0.5 + 0.5*sin(uTime*1.4);
          vec3 col = c.rgb + uGlow * pulse * 0.35;
          col = mix(col, uPrimary, 0.15);
          gl_FragColor = vec4(col, c.a);
        }
      `
    })
    return mat
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame((_, dt) => {
    material.uniforms.uTime.value += dt
    if (meshRef.current) {
      meshRef.current.rotation.y += dt * 0.22
      meshRef.current.rotation.x = Math.sin(performance.now()*0.00025)*0.15
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0.5, 0]}>
      <planeGeometry args={[18, 8, 1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}