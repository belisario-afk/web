import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useStore } from '../../state/store'
import { useSpotify } from '../../providers/SpotifyProvider'
import { createBatGeometry } from '../../three/geometry/createBatGeometry'
import { useMicEnergy } from '../../hooks/useMicEnergy'

interface Props {
  count?: number
  radius?: number
  maxHeight?: number
}

export const BatsField: React.FC<Props> = ({ count = 140, radius = 38, maxHeight = 14 }) => {
  const theme = useStore(s => s.theme)
  const { state } = useSpotify()
  const micReactive = useStore(s => s.micReactive)
  const lodNear = useStore(s => s.lodNear)
  const lodFar = useStore(s => s.lodFar)
  const batShadows = useStore(s => s.batShadows)

  const { energy: micEnergy } = useMicEnergy()

  const baseGeom = useMemo(() => createBatGeometry({ facesPerWing: 10, wingSpan: 3.0 }), [])

  // Enhanced instanced geometry with tint + seeds
  const instGeom = useMemo(() => {
    const g = baseGeom.clone()
    const flapSeed = new Float32Array(count)
    const speedFactor = new Float32Array(count)
    const radial = new Float32Array(count)
    const yOffset = new Float32Array(count)
    const scale = new Float32Array(count)
    const tint = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      flapSeed[i] = Math.random() * Math.PI * 2
      speedFactor[i] = 0.55 + Math.random() * 0.9
      radial[i] = radius * (0.35 + Math.random() * 0.65)
      yOffset[i] = (Math.random() - 0.5) * maxHeight
      scale[i] = 0.95 + Math.random() * 1.15
      tint[i] = Math.random() // 0..1 for per-instance color variety
    }
    g.setAttribute('aFlapSeed', new THREE.InstancedBufferAttribute(flapSeed, 1))
    g.setAttribute('aSpeed', new THREE.InstancedBufferAttribute(speedFactor, 1))
    g.setAttribute('aRadial', new THREE.InstancedBufferAttribute(radial, 1))
    g.setAttribute('aYOffset', new THREE.InstancedBufferAttribute(yOffset, 1))
    g.setAttribute('aScale', new THREE.InstancedBufferAttribute(scale, 1))
    g.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 1))
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
      uRimStrength: { value: 1.05 },
      uBaseDim: { value: 0.23 },
      uNear: { value: lodNear },
      uFar: { value: lodFar }
    },
    vertexShader: `
      attribute float aPart;
      attribute float aFlapSeed;
      attribute float aSpeed;
      attribute float aRadial;
      attribute float aYOffset;
      attribute float aScale;
      attribute float aTint;

      uniform float uTime;
      uniform float uEnergy;
      uniform float uNear;
      uniform float uFar;

      varying float vPart;
      varying float vRim;
      varying float vDark;
      varying float vTint;
      varying float vLod;

      float hash(float x){ return fract(sin(x*17.1234)*43758.5453); }

      void main(){
        vPart = aPart;
        vTint = aTint;

        float phase = aFlapSeed + uTime * 0.15 * aSpeed * (0.6 + uEnergy * 1.8);
        float phase2 = aFlapSeed * 1.37 + uTime * 0.22 * aSpeed * (0.5 + uEnergy * 1.2);

        float xOrbit = cos(phase) * aRadial;
        float zOrbit = sin(phase2) * aRadial;
        float yOrbit = aYOffset + sin(phase * 2.0) * (1.5 + uEnergy * 1.2);

        // Distance from origin for LOD
        float dist = length(vec3(xOrbit, yOrbit*0.35, zOrbit));
        float lod = clamp((dist - uNear) / (uFar - uNear), 0.0, 1.0);
        vLod = lod;

        float flap = sin(uTime * (4.0 + aSpeed * 3.0 + uEnergy * 8.0) + aFlapSeed);
        // Fade flap amplitude with LOD
        float flapAmp = mix(1.0, 0.1, lod);

        vec3 pos = position;

        if(aPart == 1.0 || aPart == 2.0){
          float dir = (aPart == 1.0) ? -1.0 : 1.0;
          float hinge = flapAmp * flap * (0.9 + uEnergy*1.0) * dir;
          float cx = pos.x;
          float cz = pos.z;
          float s = sin(hinge);
          float c = cos(hinge);
          pos.x = cx * c - cz * s;
          pos.z = cx * s + cz * c;
          pos.y += (sin( (pos.x*dir)*2.0 + flap ) * 0.18 * flapAmp);
        } else if (aPart == 0.0){
          pos.y += sin(uTime*2.0 + aFlapSeed)*0.025;
        } else if (aPart == 3.0){
          pos.y += sin(uTime*7.0 + aFlapSeed)*0.035 * flapAmp;
        }

        pos *= aScale * (1.0 + uEnergy*0.4 * (1.0 - lod));

        vec3 worldPos = vec3(xOrbit, yOrbit, zOrbit) + pos;

        vRim = clamp(normalize(normal).y * 0.5 + 0.5, 0.0, 1.0);
        vDark = smoothstep(0.0, 1.0, length(vec2(xOrbit, zOrbit)) / (aRadial*1.3));

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
      varying float vTint;
      varying float vLod;

      void main(){
        // Base black dim
        vec3 base = vec3(uBaseDim * (1.0 - vDark*0.5));
        // Tint (blend between glow and primary or desaturated glow)
        vec3 tintA = uGlow;
        vec3 tintB = mix(uPrimary, uGlow, 0.35);
        vec3 tint = mix(tintA, tintB, vTint);

        float rim = pow(vRim, 2.0) * uRimStrength * (1.0 - vLod*0.5);
        vec3 col = base;
        col += rim * tint * 0.7;
        col += uPrimary * (uEnergy * 0.45 * (1.0 - vLod*0.6));
        if(vPart == 1.0 || vPart == 2.0){
          col += tint * 0.12;
        }
        // LOD dimming
        col = mix(col, base * 0.6, vLod*0.4);
        float a = 0.9 - vDark * 0.4;
        if(a < 0.05) discard;
        gl_FragColor = vec4(col, a);
      }
    `
  }), [theme.ui.primary, theme.ui.glow, lodNear, lodFar])

  // Shadow config (only if enabled)
  const { scene } = useThree()
  if (batShadows) {
    scene.traverse(obj => {
      if (obj === (scene as any)) return
    })
  }

  // Music & mic energy blending logic
  const energyRef = useRef(0)
  const lastPosRef = useRef<number | null>(null)
  const velRef = useRef(0)

  useFrame((_, dt) => {
    material.uniforms.uTime.value += dt

    let targetEnergy = 0.1
    if (micReactive && micEnergy != null) {
      targetEnergy = micEnergy
    } else {
      const pos = state?.position
      if (typeof pos === 'number') {
        if (lastPosRef.current != null) {
          const delta = pos - lastPosRef.current
          velRef.current = delta
        }
        lastPosRef.current = pos
        const playingFactor = state?.paused ? 0.25 : 1
        targetEnergy = Math.min(1, (velRef.current / 900) + 0.2) * playingFactor
      }
    }
    energyRef.current += (targetEnergy - energyRef.current) * 0.1
    material.uniforms.uEnergy.value = energyRef.current
  })

  const meshRef = useRef<THREE.InstancedMesh>(null)
  return (
    <instancedMesh
      ref={meshRef}
      args={[instGeom, material, count]}
      frustumCulled={false}
      castShadow={batShadows}
      receiveShadow={false}
    />
  )
}