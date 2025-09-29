/**
 * Detailed bat swarm with:
 *  - Procedural bat geometry (body/head/ears/legs/wings)
 *  - Vertex shader wing flapping + subtle body bob
 *  - Music-reactive energy (speed & amplitude)
 *  - Additive rim highlight & faint atmospheric fade
 */
import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../../state/store'
import { useSpotify } from '../../providers/SpotifyProvider'
import { createBatGeometry } from '../../three/geometry/createBatGeometry'

interface Props {
  count?: number
  radius?: number
  maxHeight?: number
}

export const BatsField: React.FC<Props> = ({ count = 140, radius = 38, maxHeight = 14 }) => {
  const theme = useStore(s => s.theme)
  const { state } = useSpotify()

  // Base geometry (shared)
  const baseGeom = useMemo(() => createBatGeometry({ facesPerWing: 10, wingSpan: 3.0 }), [])

  // Instanced attributes
  const instGeom = useMemo(() => {
    const g = baseGeom.clone()
    const flapSeed = new Float32Array(count)
    const speedFactor = new Float32Array(count)
    const radial = new Float32Array(count)
    const yOffset = new Float32Array(count)
    const scale = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      flapSeed[i] = Math.random() * Math.PI * 2
      speedFactor[i] = 0.55 + Math.random() * 0.9
      radial[i] = radius * (0.35 + Math.random() * 0.65)
      yOffset[i] = (Math.random() - 0.5) * maxHeight
      scale[i] = 0.85 + Math.random() * 0.9
    }
    g.setAttribute('aFlapSeed', new THREE.InstancedBufferAttribute(flapSeed, 1))
    g.setAttribute('aSpeed', new THREE.InstancedBufferAttribute(speedFactor, 1))
    g.setAttribute('aRadial', new THREE.InstancedBufferAttribute(radial, 1))
    g.setAttribute('aYOffset', new THREE.InstancedBufferAttribute(yOffset, 1))
    g.setAttribute('aScale', new THREE.InstancedBufferAttribute(scale, 1))
    return g
  }, [baseGeom, count, radius, maxHeight])

  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uEnergy: { value: 0 },
      uPrimary: { value: new THREE.Color(theme.ui.primary) },
      uGlow: { value: new THREE.Color(theme.ui.glow) },
      uRimStrength: { value: 0.9 },
      uBaseDim: { value: 0.32 }
    },
    vertexShader: `
      attribute float aPart;      // 0 body/head, 1 left wing, 2 right wing, 3 legs
      attribute float aFlapSeed;
      attribute float aSpeed;
      attribute float aRadial;
      attribute float aYOffset;
      attribute float aScale;

      uniform float uTime;
      uniform float uEnergy;

      varying float vPart;
      varying float vRim;
      varying float vDark;

      // Simple hash for subtle variation
      float hash(float x){ return fract(sin(x*17.1234)*43758.5453); }

      void main(){
        vPart = aPart;

        // Instance orbital position
        float phase = aFlapSeed + uTime * 0.15 * aSpeed * (0.6 + uEnergy * 1.8);
        float phase2 = aFlapSeed * 1.37 + uTime * 0.22 * aSpeed * (0.5 + uEnergy * 1.2);

        float xOrbit = cos(phase) * aRadial;
        float zOrbit = sin(phase2) * aRadial;
        float yOrbit = aYOffset + sin(phase * 2.0) * (1.5 + uEnergy * 1.2);

        // Wing flap (sin)
        float flap = sin(uTime * (4.0 + aSpeed * 3.0 + uEnergy * 8.0) + aFlapSeed);
        // Position transform
        vec3 pos = position;

        // Wings: rotate/scale around root (approx z-axis)
        if(aPart == 1.0 || aPart == 2.0){
          // left = 1, right = 2 => direction
          float dir = (aPart == 1.0) ? -1.0 : 1.0;
          float hinge = flap * (0.8 + uEnergy*0.9) * dir;
          // rotate around body Y axis
          float cx = pos.x;
          float cz = pos.z;
          float s = sin(hinge);
          float c = cos(hinge);
          pos.x = cx * c - cz * s;
          pos.z = cx * s + cz * c;
          // slight membrane bend
          pos.y += (sin( (pos.x*dir)*2.0 + flap ) * 0.15);
        } else if (aPart == 0.0){
          // Body subtle breathing
            pos.y += sin(uTime*2.0 + aFlapSeed)*0.02;
        } else if (aPart == 3.0){
          // Legs minor jitter
          pos.y += sin(uTime*7.0 + aFlapSeed)*0.03;
        }

        // Scale whole bat
        pos *= aScale * (1.0 + uEnergy*0.4);

        // Final placement
        vec3 worldPos = vec3(xOrbit, yOrbit, zOrbit) + pos;

        // Rim factor (cheap)
        vRim = clamp(normalize(normal).y * 0.5 + 0.5, 0.0, 1.0);
        // Dark fade with distance (atmospheric)
        float dist = length(vec2(xOrbit, zOrbit));
        vDark = smoothstep(0.0, 1.0, dist / (aRadial*1.3));

        gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uPrimary;
      uniform vec3 uGlow;
      uniform float uEnergy;
      uniform float uRimStrength;
      uniform float uBaseDim;
      varying float vPart;
      varying float vRim;
      varying float vDark;

      void main(){
        // Base black
        vec3 col = vec3(uBaseDim * (1.0 - vDark*0.5));
        // Rim highlight
        float rim = pow(vRim, 2.0) * uRimStrength;
        col += rim * uGlow * 0.6;
        // Energy pulse
        col += uPrimary * (uEnergy * 0.4);
        // Subtle part accent (wings slightly brighter edges)
        if(vPart == 1.0 || vPart == 2.0){
          col += uGlow * 0.15;
        }
        float a = 0.85 - vDark * 0.35;
        if(a < 0.05) discard;
        gl_FragColor = vec4(col, a);
      }
    `
  }), [theme.ui.primary, theme.ui.glow])

  // Track energy
  const energyRef = useRef(0)
  const lastPosRef = useRef<number | null>(null)
  const velRef = useRef(0)

  useFrame((_, dt) => {
    material.uniforms.uTime.value += dt
    // Music energy (heuristic)
    const pos = state?.position
    if (typeof pos === 'number') {
      if (lastPosRef.current != null) {
        const delta = pos - lastPosRef.current
        velRef.current = delta
      }
      lastPosRef.current = pos
      const playingFactor = state?.paused ? 0.2 : 1
      const target = Math.min(1, (velRef.current / 900) + 0.18) * playingFactor
      energyRef.current += (target - energyRef.current) * 0.08
    } else {
      energyRef.current += (0.1 - energyRef.current) * 0.05
    }
    material.uniforms.uEnergy.value = energyRef.current
  })

  return (
    <instancedMesh args={[instGeom, material, count]} frustumCulled={false} />
  )
}