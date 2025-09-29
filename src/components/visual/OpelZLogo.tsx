import React, { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../../state/store'

/**
 * Lightweight logo: a single plane with a dynamically generated canvas texture.
 * Avoids drei <Text> + font resolver to prevent context-loss race conditions.
 */
function makeLetterTexture(letter: string, fg: string, glow: string, bg = 'transparent') {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, size, size)

  // Background (transparent or subtle radial)
  if (bg !== 'transparent') {
    const rad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    rad.addColorStop(0, bg)
    rad.addColorStop(1, bg)
    ctx.fillStyle = rad
    ctx.fillRect(0, 0, size, size)
  }

  // Outer glow
  ctx.font = 'bold 360px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = glow
  ctx.shadowBlur = 48
  ctx.fillStyle = fg
  ctx.fillText(letter, size / 2, size / 2 + 20)

  // Inner stroke accent
  ctx.shadowBlur = 0
  ctx.lineWidth = 8
  ctx.strokeStyle = glow
  ctx.strokeText(letter, size / 2, size / 2 + 20)

  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter = THREE.LinearMipMapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.anisotropy = 4
  return tex
}

export const OpelZLogo: React.FC<{ hologram?: boolean; rotationSpeed?: number }> = ({
  hologram = false,
  rotationSpeed = 0.22
}) => {
  const theme = useStore(s => s.theme)
  const speed = useStore(s => s.speed)
  const texture = useMemo(
    () => makeLetterTexture('Z', theme.ui.primary, theme.ui.glow),
    [theme.ui.primary, theme.ui.glow]
  )

  const material = useMemo(() => {
    if (hologram) {
      return new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
          uTime: { value: 0 },
          uTex: { value: texture },
          uPrimary: { value: new THREE.Color(theme.ui.primary) },
          uGlow: { value: new THREE.Color(theme.ui.glow) }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
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
            vec4 base = texture2D(uTex, vUv);
            if(base.a < 0.05) discard;
            float scan = sin((vUv.y + uTime*0.8)*80.0)*0.5+0.5;
            float flick = step(0.995, fract(sin(dot(vUv*vec2(123.4,456.7), vec2(12.9898,78.233)))*43758.5453));
            vec3 col = mix(base.rgb, uPrimary, 0.25);
            col += uGlow * (0.25 + 0.55*scan);
            col += flick * 0.4 * uGlow;
            gl_FragColor = vec4(col, base.a);
          }
        `
      })
    }
    return new THREE.MeshBasicMaterial({ map: texture, transparent: true })
  }, [texture, hologram, theme.ui.primary, theme.ui.glow])

  const meshRef = React.useRef<THREE.Mesh>(null)

  useFrame((_, dt) => {
    if (meshRef.current) {
      const intensity = Math.min(1, speed / 40)
      meshRef.current.rotation.y += dt * (rotationSpeed + intensity * 0.4)
      meshRef.current.rotation.x = Math.sin(performance.now() * 0.00018) * 0.18 * (0.4 + intensity)
      if ((material as any).uniforms?.uTime) {
        ;(material as any).uniforms.uTime.value += dt
      }
    }
  })

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[6, 6, 1, 1]} />
      <primitive attach="material" object={material} />
    </mesh>
  )
}