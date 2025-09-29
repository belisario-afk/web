/**
 * Advanced bat swarm with:
 *  - Detailed mega bat geometry
 *  - Smooth pattern flight + formation blending (Belisario / Bat symbol)
 *  - Album-reactive color gradient & per-instance tint
 *  - GPU flap + formation interpolation (no CPU per-frame layout)
 *  - Press 'F' (while screensaver active) to cycle formations.
 */
import React, { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../../state/store'
import { useSpotify } from '../../providers/SpotifyProvider'
import { useAlbumColor } from '../../hooks/useAlbumColor'
import { createMegaBatGeometry } from '../../three/geometry/createMegaBatGeometry'

interface Props {
  count?: number
  radius?: number
  formationTransitionMs?: number
  patternIntervalMs?: number
}

type FormationKind = 'free' | 'word' | 'symbol'

export const BatsField: React.FC<Props> = ({
  count = 180,
  radius = 42,
  formationTransitionMs = 1800,
  patternIntervalMs = 16000
}) => {
  const theme = useStore(s => s.theme)
  const { state } = useSpotify()
  const albumHex = useAlbumColor(4000)

  // Formation cycle state (local; can expose to store if needed)
  const formation = useRef<FormationKind>('free')
  const formationBlend = useRef(0) // 0 free, 1 fully formation
  const switchingRef = useRef(false)
  const switchStartRef = useRef(0)
  const formationTargetBlend = useRef(0)

  // Listen for key 'F' to cycle formation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f') {
        if (formation.current === 'free') formation.current = 'word'
        else if (formation.current === 'word') formation.current = 'symbol'
        else formation.current = 'free'
        // Set target blend
        formationTargetBlend.current = formation.current === 'free' ? 0 : 1
        switchStartRef.current = performance.now()
        switchingRef.current = true
        bakeFormationPoints() // ensure updated
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Album / theme colors
  const albumColor = useMemo(() => {
    if (!albumHex) return new THREE.Color(theme.ui.primary)
    try { return new THREE.Color(albumHex) } catch { return new THREE.Color(theme.ui.primary) }
  }, [albumHex, theme.ui.primary])

  // Base geometry (detailed)
  const baseGeom = useMemo(() => createMegaBatGeometry({ wingSegments: 9, wingSpan: 3.4 }), [])

  // -----------------------
  // FORMATION POINT GENERATION
  // -----------------------
  const wordPointsRef = useRef<THREE.Vector3[]>([])
  const symbolPointsRef = useRef<THREE.Vector3[]>([])

  function makeWordPoints(word: string, targetCount: number) {
    const canvas = document.createElement('canvas')
    const W = 600, H = 140
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 110px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(word, W / 2, H / 2)
    const img = ctx.getImageData(0, 0, W, H).data
    const pts: THREE.Vector3[] = []
    for (let y = 0; y < H; y += 4) {
      for (let x = 0; x < W; x += 4) {
        const i = (y * W + x) * 4
        if (img[i] > 180) { // white pixel
          pts.push(new THREE.Vector3(
            ((x / W) - 0.5) * 40,
            ((0.5 - y / H)) * 12,
            0
          ))
        }
      }
    }
    // If too many, sample down
    if (pts.length > targetCount) {
      const sampled: THREE.Vector3[] = []
      for (let i = 0; i < targetCount; i++) {
        sampled.push(pts[Math.floor((i / targetCount) * pts.length)])
      }
      return sampled
    }
    return pts
  }

  function makeSymbolPoints(targetCount: number) {
    // ASCII mask for a Batman-like emblem (coarse)
    const mask = [
      '........#####........',
      '......#########......',
      '.....###########.....',
      '....#############....',
      '...###############...',
      '..#################..',
      '.#######...#######...',
      '.######.....######...',
      '.#####.......#####...',
      '..###.........###....',
      '...##.........##.....'
    ]
    const pts: THREE.Vector3[] = []
    const rows = mask.length
    const cols = mask[0].length
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (mask[r][c] === '#') {
          const x = (c / cols - 0.5) * 42
          const y = (0.5 - r / rows) * 14
          // random small jitter for organic look
            pts.push(new THREE.Vector3(x + (Math.random()-0.5)*0.6, y + (Math.random()-0.5)*0.4, 0))
        }
      }
    }
    // Densify / sample
    if (pts.length < targetCount) {
      const extraNeeded = targetCount - pts.length
      for (let i = 0; i < extraNeeded; i++) {
        pts.push(pts[i % pts.length].clone().add(new THREE.Vector3(
          (Math.random()-0.5)*1.2,
          (Math.random()-0.5)*1.0,
          (Math.random()-0.5)*0.3
        )))
      }
    } else if (pts.length > targetCount) {
      const sampled: THREE.Vector3[] = []
      for (let i = 0; i < targetCount; i++) {
        sampled.push(pts[Math.floor((i / targetCount) * pts.length)])
      }
      return sampled
    }
    return pts
  }

  // Bake formation point arrays (called initially & when cycling)
  function bakeFormationPoints() {
    wordPointsRef.current = makeWordPoints('Belisario', count)
    symbolPointsRef.current = makeSymbolPoints(count)
  }

  useEffect(() => {
    bakeFormationPoints()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  // ------------------------------------
  // INSTANCE ATTRIBUTE PREPARATION
  // ------------------------------------
  const instGeom = useMemo(() => {
    const g = baseGeom.clone()
    const aPhase = new Float32Array(count)
    const aSeed = new Float32Array(count)
    const aRadius = new Float32Array(count)
    const aYSeed = new Float32Array(count)
    const aScale = new Float32Array(count)
    const aTint = new Float32Array(count)
    // Formation base positions (populated once – updated on cycle by buffer rewrite)
    const aFormX = new Float32Array(count)
    const aFormY = new Float32Array(count)
    const aFormZ = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      aPhase[i] = Math.random() * Math.PI * 2
      aSeed[i] = Math.random() * 1000
      aRadius[i] = radius * (0.35 + Math.random() * 0.65)
      aYSeed[i] = (Math.random() - 0.5) * 14
      aScale[i] = 0.9 + Math.random() * 1.4
      aTint[i] = Math.random()
      // placeholder formation coords; will fill after geometry creation
      aFormX[i] = 0; aFormY[i] = 0; aFormZ[i] = 0
    }
    g.setAttribute('aPhase', new THREE.InstancedBufferAttribute(aPhase, 1))
    g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 1))
    g.setAttribute('aRadius', new THREE.InstancedBufferAttribute(aRadius, 1))
    g.setAttribute('aYSeed', new THREE.InstancedBufferAttribute(aYSeed, 1))
    g.setAttribute('aScale', new THREE.InstancedBufferAttribute(aScale, 1))
    g.setAttribute('aTint', new THREE.InstancedBufferAttribute(aTint, 1))
    g.setAttribute('aFormX', new THREE.InstancedBufferAttribute(aFormX, 1))
    g.setAttribute('aFormY', new THREE.InstancedBufferAttribute(aFormY, 1))
    g.setAttribute('aFormZ', new THREE.InstancedBufferAttribute(aFormZ, 1))
    return g
  }, [baseGeom, count, radius])

  // Helper to write formation array into instanced attributes
  function applyFormation(kind: FormationKind) {
    const formX = instGeom.getAttribute('aFormX') as THREE.InstancedBufferAttribute
    const formY = instGeom.getAttribute('aFormY') as THREE.InstancedBufferAttribute
    const formZ = instGeom.getAttribute('aFormZ') as THREE.InstancedBufferAttribute
    const pts = kind === 'word'
      ? wordPointsRef.current
      : kind === 'symbol'
        ? symbolPointsRef.current
        : []
    for (let i = 0; i < formX.count; i++) {
      if (pts.length && i < pts.length) {
        formX.setX(i, pts[i].x)
        formY.setX(i, pts[i].y)
        formZ.setX(i, pts[i].z)
      } else {
        // ornamental ring around center if extra
        const ang = (i / formX.count) * Math.PI * 2
        formX.setX(i, Math.cos(ang) * 46)
        formY.setX(i, Math.sin(ang * 2) * 4)
        formZ.setX(i, Math.sin(ang) * 6)
      }
    }
    formX.needsUpdate = formY.needsUpdate = formZ.needsUpdate = true
  }

  // Apply default (for when switching starts)
  useEffect(() => {
    applyFormation('word')
    applyFormation('symbol')
    // Set initial type again (free)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Material / shader
  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uEnergy: { value: 0 },
      uThemeGlow: { value: new THREE.Color(theme.ui.glow) },
      uThemePrimary: { value: new THREE.Color(theme.ui.primary) },
      uAlbumColor: { value: albumColor.clone() },
      uRadiusGlobal: { value: radius },
      uFormationBlend: { value: 0 },
      uPatternA: { value: 0 },
      uPatternB: { value: 1 },
      uPatternBlend: { value: 0 }
    },
    vertexShader: `
      attribute float aPart;
      attribute float aPhase;
      attribute float aSeed;
      attribute float aRadius;
      attribute float aYSeed;
      attribute float aScale;
      attribute float aTint;
      attribute float aFormX;
      attribute float aFormY;
      attribute float aFormZ;

      uniform float uTime;
      uniform float uEnergy;
      uniform float uPatternA;
      uniform float uPatternB;
      uniform float uPatternBlend;
      uniform float uRadiusGlobal;
      uniform float uFormationBlend; // 0 free, 1 formation

      varying float vPart;
      varying float vTint;
      varying float vDepthFade;
      varying float vFormMix;

      // Motion patterns as before (simplified)
      vec3 patternPos(float pid, float baseAng, float r, float ySeed) {
        if (pid < 0.5) {
          return vec3(
            cos(baseAng)*r,
            sin(baseAng*0.8 + ySeed*0.3)*1.8,
            sin(baseAng*1.1)*r*0.85
          );
        } else if (pid < 1.5) { // figure 8
          return vec3(
            sin(baseAng)*r*0.8,
            cos(baseAng*1.2 + ySeed*0.4)*2.4,
            sin(baseAng*2.0)*r*0.4
          );
        } else if (pid < 2.5) { // slow spiral
          float rr = r*(0.6+0.4*sin(baseAng*0.25));
          float y = mod(baseAng*0.3 + ySeed*0.5, 6.5)-3.25;
          return vec3(cos(baseAng)*rr, y, sin(baseAng)*rr);
        } else { // vortex wave
          float wob = sin(uTime*0.4)*0.7;
          return vec3(
            cos(baseAng + wob)*r*0.95,
            sin(baseAng*2.6 + ySeed)*2.5,
            sin(baseAng + wob)*r*0.95
          );
        }
      }

      // Smooth cubic function
      float smoothCubic(float x){ return x*x*(3.0-2.0*x); }

      void main(){
        vPart = aPart;
        vTint = aTint;
        vFormMix = uFormationBlend;

        float speedMul = 0.33 + uEnergy*0.9;
        float baseAng = aPhase + uTime * speedMul * (0.55 + fract(aSeed*0.41));
        float r = aRadius;

        vec3 pA = patternPos(uPatternA, baseAng, r, aYSeed);
        vec3 pB = patternPos(uPatternB, baseAng*1.018, r, aYSeed);
        vec3 freePos = mix(pA, pB, uPatternBlend);

        // Formation target
        vec3 formationPos = vec3(aFormX, aFormY, aFormZ);

        // Blend between free motion and formation (ease)
        float formT = smoothCubic(uFormationBlend);
        vec3 center = mix(freePos, formationPos, formT);

        // Wing flap refined (cubic smoothed)
        float flapBase = sin(uTime*(4.0 + uEnergy*6.0) + aSeed);
        float flap = smoothCubic( (flapBase*0.5 + 0.5) ) * 2.0 - 1.0; // -1..1 Smooth
        vec3 pos = position;

        if(aPart == 1.0 || aPart == 2.0){
          float dir = (aPart == 1.0) ? -1.0 : 1.0;
          float hinge = flap * (0.85 + uEnergy*0.8) * dir;
          float cx = pos.x;
          float cz = pos.z;
          float s = sin(hinge);
          float c = cos(hinge);
          pos.x = cx*c - cz*s;
          pos.z = cx*s + cz*c;
          pos.y += sin(pos.x*dir*2.0 + hinge)*0.15;
        } else if (aPart == 0.0){
          pos.y += sin(uTime*2.0 + aSeed)*0.02;
        }

        // Body roll while turning (from derivative of center.x)
        float roll = sin(baseAng + aSeed)*0.25 * (1.0 - formT*0.5);
        float cR = cos(roll);
        float sR = sin(roll);
        vec3 rotated = vec3(pos.x, pos.y*cR - pos.z*sR, pos.y*sR + pos.z*cR);
        pos = rotated;

        pos *= aScale * (1.0 + uEnergy*0.4*(1.0-formT));

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
      uniform float uFormationBlend;

      varying float vPart;
      varying float vTint;
      varying float vDepthFade;
      varying float vFormMix;

      void main(){
        float baseDim = 0.25 + 0.12*uEnergy;
        vec3 albumMix = mix(uThemePrimary, uAlbumColor, 0.65);
        // Gradient: interpolate album -> glow using per-instance tint
        vec3 tint = mix(albumMix, uThemeGlow, vTint*0.75);
        // Add slight dark lift when in formation (for readability)
        float formBoost = vFormMix * 0.15;
        vec3 col = vec3(baseDim + formBoost) + tint*(0.15 + 0.4*uEnergy);
        if(vPart == 1.0 || vPart == 2.0){
          col += tint * 0.15;
        }
        col *= (1.0 - vDepthFade*0.35);
        float alpha = 0.9 - vDepthFade*0.45;
        if(alpha < 0.05) discard;
        gl_FragColor = vec4(col, alpha);
      }
    `
  }), [theme.ui.glow, theme.ui.primary, albumColor, radius])

  // Playback heuristic energy (fallback)
  const energyRef = useRef(0)
  const lastPosRef = useRef<number | null>(null)
  const velRef = useRef(0)

  // Pattern cycling (still used underneath for free mode)
  const patternARef = useRef(0)
  const patternBRef = useRef(1)
  const patternStartRef = useRef(performance.now())

  useEffect(() => { patternStartRef.current = performance.now() }, [patternIntervalMs])

  useFrame(() => {
    const uni = material.uniforms
    const now = performance.now()
    uni.uTime.value = now * 0.001

    // Pattern progression
    const t = now - patternStartRef.current
    const phase = (t % patternIntervalMs) / patternIntervalMs
    const blend = Math.sin(phase * Math.PI) * 0.5 + 0.5
    uni.uPatternBlend.value = blend

    if (phase < 0.02) {
      patternARef.current = patternBRef.current
      let next = patternARef.current
      while (next === patternARef.current) next = Math.floor(Math.random() * 4)
      patternBRef.current = next
      uni.uPatternA.value = patternARef.current
      uni.uPatternB.value = patternBRef.current
    } else {
      uni.uPatternA.value = patternARef.current
      uni.uPatternB.value = patternBRef.current
    }

    // Energy (velocity heuristic)
    const pos = state?.position
    let targetEnergy = 0.12
    if (typeof pos === 'number') {
      if (lastPosRef.current != null) velRef.current = pos - lastPosRef.current
      lastPosRef.current = pos
      const playingFactor = state?.paused ? 0.3 : 1
      targetEnergy = Math.min(1, velRef.current / 900 + 0.2) * playingFactor
    }
    energyRef.current += (targetEnergy - energyRef.current) * 0.08
    uni.uEnergy.value = energyRef.current

    // Smooth formation blending
    if (switchingRef.current) {
      const elapsed = now - switchStartRef.current
      const duration = formationTransitionMs
      if (elapsed >= duration) {
        formationBlend.current = formationTargetBlend.current
        switchingRef.current = false
      } else {
        const k = elapsed / duration
        // ease in/out
        const eased = k * k * (3 - 2 * k)
        formationBlend.current = THREE.MathUtils.lerp(
          formationBlend.current,
          formationTargetBlend.current,
          eased
        )
      }
      uni.uFormationBlend.value = formationBlend.current
    } else {
      uni.uFormationBlend.value = formationBlend.current
    }

    // Update album color uniform gradually
    ;(uni.uAlbumColor.value as THREE.Color).lerp(albumColor, 0.07)
  })

  const meshRef = useRef<THREE.InstancedMesh>(null)

  return (
    <instancedMesh
      ref={meshRef}
      args={[instGeom, material, count]}
      frustumCulled={false}
    />
  )
}