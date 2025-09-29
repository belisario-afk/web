/**
 * Pattern + album-reactive bats.
 * Patterns:
 *  0 Orbit, 1 Figure8, 2 Spiral Rise, 3 Vortex Wave
 * Cycle every PATTERN_INTERVAL_MS with smooth blend.
 */
import React, { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../../state/store'
import { useSpotify } from '../../providers/SpotifyProvider'
import { useAlbumColor } from '../../hooks/useAlbumColor'
import { createBatGeometry } from '../../three/geometry/createBatGeometry'

interface Props {
  count?: number
  radius?: number
  maxHeight?: number
  patternIntervalMs?: number
}

export const BatsField: React.FC<Props> = ({
  count = 140,
  radius = 40,
  maxHeight = 15,
  patternIntervalMs = 18000
}) => {
  const theme = useStore(s => s.theme)
  const { state } = useSpotify()
  const albumHex = useAlbumColor()
  const albumColor = useMemo(() => {
    if (!albumHex) return new THREE.Color(theme.ui.primary)
    try {
      return new THREE.Color(albumHex)
    } catch {
      return new THREE.Color(theme.ui.primary)
    }
  }, [albumHex, theme.ui.primary])

  const baseGeom = useMemo(() => createBatGeometry({ facesPerWing: 10, wingSpan: 3.1 }), [])

  const instGeom = useMemo(() => {
    const g = baseGeom.clone()
    const phase = new Float32Array(count)
    const seed = new Float32Array(count)
    const r = new Float32Array(count)
    const ySeed = new Float32Array(count)
    const scale = new Float32Array(count)
    const tint = new Float32Array(count) // per-instance color variance

    for (let i = 0; i < count; i++) {
      phase[i] = Math.random() * Math.PI * 2
      seed[i] = Math.random() * 1000
      r[i] = radius * (0.35 + Math.random() * 0.65)
      ySeed[i] = (Math.random() - 0.5) * maxHeight
      scale[i] = 0.9 + Math.random() * 1.3
      tint[i] = Math.random()
    }
    g.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1))
    g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 1))
    g.setAttribute('aRadius', new THREE.InstancedBufferAttribute(r, 1))
    g.setAttribute('aYSeed', new THREE.InstancedBufferAttribute(ySeed, 1))
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
      uThemeGlow: { value: new THREE.Color(theme.ui.glow) },
      uThemePrimary: { value: new THREE.Color(theme.ui.primary) },
      uAlbumColor: { value: albumColor },
      uPatternA: { value: 0 },
      uPatternB: { value: 1 },
      uPatternBlend: { value: 0 },
      uRadiusGlobal: { value: radius }
    },
    vertexShader: `
      attribute float aPart;
      attribute float aPhase;
      attribute float aSeed;
      attribute float aRadius;
      attribute float aYSeed;
      attribute float aScale;
      attribute float aTint;

      uniform float uTime;
      uniform float uEnergy;
      uniform float uPatternA;
      uniform float uPatternB;
      uniform float uPatternBlend;
      uniform float uRadiusGlobal;

      varying float vPart;
      varying float vTint;
      varying float vDepthFade;

      // Returns pattern position for given pattern id (0..3)
      vec3 patternPos(float pid, float baseAng, float seedR, float ySeed) {
        // baseAng changes speed slightly per instance
        if (pid < 0.5) { // Orbit
          return vec3(
            cos(baseAng) * seedR,
            sin(baseAng*0.8 + ySeed*0.3) * 1.6 + sin(ySeed*0.7)*0.6,
            sin(baseAng*1.1) * seedR * 0.85
          );
        } else if (pid < 1.5) { // Figure 8
          return vec3(
            sin(baseAng) * seedR * 0.75,
            cos(baseAng*1.2 + ySeed*0.4) * 2.2,
            sin(baseAng*2.0) * seedR * 0.4
          );
        } else if (pid < 2.5) { // Spiral rise
          float spiralR = seedR*(0.5+0.5*sin(baseAng*0.25));
          float y = mod(baseAng*0.25 + ySeed*0.5, 6.0) - 3.0;
          return vec3(
            cos(baseAng)*spiralR,
            y,
            sin(baseAng)*spiralR
          );
        } else { // Vortex wave
          float wob = sin(uTime*0.5)*0.6;
          return vec3(
            cos(baseAng + wob)*seedR*0.95,
            sin(baseAng*2.5 + ySeed) * 2.2,
            sin(baseAng + wob)*seedR*0.95
          );
        }
      }

      void main(){
        vPart = aPart;
        vTint = aTint;

        float speedMul = 0.35 + uEnergy*0.9;
        float baseAng = aPhase + uTime * speedMul * (0.6 + fract(aSeed*0.37));
        float r = aRadius;

        vec3 pA = patternPos(uPatternA, baseAng, r, aYSeed);
        vec3 pB = patternPos(uPatternB, baseAng*1.02, r, aYSeed);
        vec3 center = mix(pA, pB, uPatternBlend);

        // Wing flap
        float flap = sin(uTime*(4.0 + uEnergy*6.0) + aSeed);
        vec3 pos = position;

        if(aPart == 1.0 || aPart == 2.0) {
          float dir = (aPart == 1.0) ? -1.0 : 1.0;
          float hinge = flap * (0.9 + uEnergy) * dir;
          float cx = pos.x;
          float cz = pos.z;
          float s = sin(hinge);
          float c = cos(hinge);
          pos.x = cx * c - cz * s;
          pos.z = cx * s + cz * c;
          pos.y += sin(pos.x*dir*2.0 + flap)*0.18;
        } else if (aPart == 0.0) {
          pos.y += sin(uTime*2.0 + aSeed)*0.025;
        }

        // Scale
        pos *= aScale * (1.0 + uEnergy*0.4);

        vec3 world = center + pos;
        float dist = length(world.xz) / uRadiusGlobal;
        vDepthFade = clamp(dist, 0.0, 1.0);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(world,1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uThemeGlow;
      uniform vec3 uThemePrimary;
      uniform vec3 uAlbumColor;
      uniform float uEnergy;

      varying float vPart;
      varying float vTint;
      varying float vDepthFade;

      void main(){
        float baseDim = 0.22 + 0.1*uEnergy;
        vec3 base = vec3(baseDim * (1.0 - vDepthFade*0.4));
        // Album reactive tint blend
        vec3 album = mix(uThemePrimary, uAlbumColor, 0.65);
        vec3 tintPrimary = mix(album, uThemeGlow, 0.35);
        vec3 tint = mix(tintPrimary, uThemeGlow, vTint*0.7);

        // Wings slightly brighter
        if(vPart == 1.0 || vPart == 2.0){
          base += tint * (0.18 + 0.3*uEnergy);
        } else {
          base += tint * (0.1 + 0.25*uEnergy);
        }

        // Subtle depth fade modulation
        base *= 1.0 - vDepthFade*0.25;

        float alpha = 0.9 - vDepthFade*0.45;
        if(alpha < 0.05) discard;
        gl_FragColor = vec4(base, alpha);
      }
    `
  }), [theme.ui.glow, theme.ui.primary, albumColor, radius])

  // Track playback heuristic fallback energy
  const energyRef = useRef(0)
  const lastPosRef = useRef<number | null>(null)
  const velRef = useRef(0)

  // Pattern cycling
  const patternARef = useRef(0)
  const patternBRef = useRef(1)
  const blendRef = useRef(0)
  const patternStartRef = useRef(performance.now())

  useEffect(() => {
    patternStartRef.current = performance.now()
  }, [patternIntervalMs])

  useFrame(() => {
    const uni = material.uniforms
    uni.uTime.value = performance.now() * 0.001

    // Pattern progression
    const t = performance.now() - patternStartRef.current
    const phase = (t % patternIntervalMs) / patternIntervalMs
    blendRef.current = THREE.MathUtils.smootherstep(
      Math.sin(phase * Math.PI) * 0.5 + 0.5,
      0, 1
    )
    uni.uPatternBlend.value = blendRef.current

    // At cycle boundary pick a new target pattern
    if (phase < 0.02) {
      patternARef.current = patternBRef.current
      let next = patternARef.current
      while (next === patternARef.current) {
        next = Math.floor(Math.random() * 4)
      }
      patternBRef.current = next
      uni.uPatternA.value = patternARef.current
      uni.uPatternB.value = patternBRef.current
    } else {
      uni.uPatternA.value = patternARef.current
      uni.uPatternB.value = patternBRef.current
    }

    // Energy calc (fallback if album color only)
    const pos = state?.position
    let targetEnergy = 0.12
    if (typeof pos === 'number') {
      if (lastPosRef.current != null) {
        const delta = pos - lastPosRef.current
        velRef.current = delta
      }
      lastPosRef.current = pos
      const playingFactor = state?.paused ? 0.25 : 1
      targetEnergy = Math.min(1, velRef.current / 900 + 0.2) * playingFactor
    }
    energyRef.current += (targetEnergy - energyRef.current) * 0.08
    uni.uEnergy.value = energyRef.current

    // Update album color uniform smoothly
    if (uni.uAlbumColor.value instanceof THREE.Color) {
      ;(uni.uAlbumColor.value as THREE.Color).lerp(albumColor, 0.08)
    }
  })

  return (
    <instancedMesh
      args={[instGeom, material, count]}
      frustumCulled={false}
    />
  )
}