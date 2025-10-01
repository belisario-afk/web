import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../../state/store'

export const ScreensaverLogo: React.FC = () => {
  const theme = useStore(s => s.theme)
  const meshRef = useRef<THREE.Mesh>(null)

  const material = useMemo(() => {
    const loader = new THREE.TextureLoader()
    let disposed = false

    function vectorFallback(): THREE.Texture {
      const size = 256
      const c = document.createElement('canvas')
      c.width = c.height = size
      const ctx = c.getContext('2d')!
      ctx.fillStyle = '#000'
      ctx.fillRect(0,0,size,size)
      ctx.fillStyle = '#222'
      ctx.beginPath()
      ctx.moveTo(20,180)
      ctx.quadraticCurveTo(64,40,128,90)
      ctx.quadraticCurveTo(192,40,236,180)
      ctx.lineTo(200,150)
      ctx.quadraticCurveTo(128,210,56,150)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = '#777'
      ctx.lineWidth = 5
      ctx.stroke()
      ctx.font = 'bold 110px system-ui'
      ctx.textAlign='center'
      ctx.textBaseline='middle'
      ctx.fillStyle = '#FFDD00'
      ctx.fillText('Z', size/2, size/2+8)
      const tex = new THREE.CanvasTexture(c)
      tex.colorSpace = THREE.SRGBColorSpace
      return tex
    }

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTex: { value: vectorFallback() },
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
          if(c.a < 0.05) discard;
          float pulse = 0.5 + 0.5*sin(uTime*1.25);
          vec3 col = c.rgb + uGlow * (0.20 + 0.35*pulse);
          col = mix(col, uPrimary, 0.12 + 0.05*pulse);
          gl_FragColor = vec4(col, c.a);
        }
      `
    })

    function tryPNG() {
      loader.load('/web/screensaver/bat-opel.png',
        tex => { if (!disposed) { tex.colorSpace = THREE.SRGBColorSpace; mat.uniforms.uTex.value = tex } },
        undefined,
        () => { /* keep fallback */ }
      )
    }

    loader.load('/web/screensaver/bat-opel.webp',
      tex => { if (!disposed) { tex.colorSpace = THREE.SRGBColorSpace; mat.uniforms.uTex.value = tex } },
      undefined,
      () => tryPNG()
    )

    ;(mat as any).__dispose = () => { disposed = true }
    return mat
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame((_, dt) => {
    material.uniforms.uTime.value += dt
    if (meshRef.current) {
      meshRef.current.rotation.y += dt * 0.18
      meshRef.current.rotation.x = Math.sin(performance.now()*0.0002)*0.12
    }
  })

  return (
    <mesh ref={meshRef} position={[0,0.6,0]}>
      <planeGeometry args={[18,8]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}