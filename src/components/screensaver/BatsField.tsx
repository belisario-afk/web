/**
 * Hardened bat swarm:
 * - Fixed attribute layout (no dynamic gl.getParameter).
 * - Packed per-instance data into two vec4 attributes: aData1 (phase, seed, radius, ySeed), aData2 (scale, tint, formX, formY).
 * - Formation positions updated in-buffer only when switching.
 * - Adaptive active count via uActiveCount (GPU discard for indices >= activeCount).
 * - Free patterns + word ("Belisario") + symbol formation cycle (press 'F').
 */
import React, { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../../state/store'
import { useSpotify } from '../../providers/SpotifyProvider'
import { useAlbumColor } from '../../hooks/useAlbumColor'
import { createMegaBatGeometry } from '../../three/geometry/createMegaBatGeometry'

type FormationKind = 'free' | 'word' | 'symbol'

interface Props {
  count?: number
  radius?: number
  formationTransitionMs?: number
  patternIntervalMs?: number
}

export const BatsField: React.FC<Props> = ({
  count = 150,
  radius = 40,
  formationTransitionMs = 1400,
  patternIntervalMs = 13000
}) => {
  const theme = useStore(s => s.theme)
  const { state } = useSpotify()
  const albumHex = useAlbumColor(3000)

  const albumColor = useMemo(() => {
    try { return new THREE.Color(albumHex || theme.ui.primary) } catch { return new THREE.Color(theme.ui.primary) }
  }, [albumHex, theme.ui.primary])

  const geometryBase = useMemo(
    () => createMegaBatGeometry({ wingSegments: 8, wingSpan: 3.2 }),
    []
  )

  // Instanced buffer packing
  const instGeom = useMemo(() => {
    const g = geometryBase.clone()
    const aData1 = new Float32Array(count * 4) // phase, seed, radius, ySeed
    const aData2 = new Float32Array(count * 4) // scale, tint, formX, formY
    const aFormZ = new Float32Array(count)     // formation Z

    for (let i = 0; i < count; i++) {
      const phase = Math.random() * Math.PI * 2
      const seed = Math.random() * 1000
      const rad = radius * (0.35 + Math.random() * 0.65)
      const ySeed = (Math.random() - 0.5) * 14
      const scale = 0.95 + Math.random() * 1.4
      const tint = Math.random()
      aData1.set([phase, seed, rad, ySeed], i * 4)
      aData2.set([scale, tint, 0, 0], i * 4)
      aFormZ[i] = 0
    }

    g.setAttribute('aData1', new THREE.InstancedBufferAttribute(aData1, 4))
    g.setAttribute('aData2', new THREE.InstancedBufferAttribute(aData2, 4))
    g.setAttribute('aFormZ', new THREE.InstancedBufferAttribute(aFormZ, 1))
    return g
  }, [geometryBase, count, radius])

  // Formation point caches
  const wordPtsRef = useRef<THREE.Vector3[]>([])
  const symPtsRef = useRef<THREE.Vector3[]>([])

  function normalizeSet(pts: THREE.Vector3[], target: number) {
    if (pts.length > target) {
      const out: THREE.Vector3[] = []
      for (let i = 0; i < target; i++) out.push(pts[Math.floor((i / target) * pts.length)])
      return out
    }
    while (pts.length < target && pts.length > 0) {
      pts.push(
        pts[Math.floor(Math.random() * pts.length)].clone().add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 0.8,
            (Math.random() - 0.5) * 0.6,
            (Math.random() - 0.5) * 0.4
          )
        )
      )
    }
    return pts
  }

  function makeWord(word: string) {
    const cvs = document.createElement('canvas')
    const W = 640, H = 160
    cvs.width = W; cvs.height = H
    const ctx = cvs.getContext('2d')!
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 118px system-ui,sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(word, W / 2, H / 2)
    const data = ctx.getImageData(0, 0, W, H).data
    const pts: THREE.Vector3[] = []
    for (let y = 0; y < H; y += 4) {
      for (let x = 0; x < W; x += 4) {
        const i = (y * W + x) * 4
        if (data[i] > 180) {
          pts.push(new THREE.Vector3(
            ((x / W) - 0.5) * 44,
            ((0.5 - y / H)) * 14,
            0
          ))
        }
      }
    }
    return normalizeSet(pts, count)
  }

  const symbolMask = [
    '.........######.........',
    '.......##########.......',
    '......############......',
    '.....##############.....',
    '....################....',
    '...#####..##..#####.....',
    '..#####....##....####...',
    '..####...........####...',
    '..###.............###...',
    '...##.............##....'
  ]

  function makeSymbol() {
    const rows = symbolMask.length
    const cols = symbolMask[0].length
    const pts: THREE.Vector3[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (symbolMask[r][c] === '#') {
          const x = (c / cols - 0.5) * 44
          const y = (0.5 - r / rows) * 14
          pts.push(new THREE.Vector3(
            x + (Math.random() - 0.5) * 0.5,
            y + (Math.random() - 0.5) * 0.4,
            (Math.random() - 0.5) * 0.4
          ))
        }
      }
    }
    return normalizeSet(pts, count)
  }

  useEffect(() => {
    wordPtsRef.current = makeWord('Belisario')
    symPtsRef.current = makeSymbol()
  }, [count])

  // Apply formation coordinates into buffers
  function applyFormation(kind: FormationKind) {
    const pts = kind === 'word' ? wordPtsRef.current : kind === 'symbol' ? symPtsRef.current : null
    const aData2 = instGeom.getAttribute('aData2') as THREE.InstancedBufferAttribute
    const aFormZ = instGeom.getAttribute('aFormZ') as THREE.InstancedBufferAttribute
    if (!pts) return
    for (let i = 0; i < aData2.count; i++) {
      const scale = aData2.getX(i)
      const tint = aData2.getY(i)
      if (i < pts.length) {
        aData2.setXYZW(i, scale, tint, pts[i].x, pts[i].y)
        aFormZ.setX(i, pts[i].z)
      } else {
        const ang = (i / aData2.count) * Math.PI * 2
        const fx = Math.cos(ang) * (radius + 4)
        const fy = Math.sin(ang * 2) * 6
        const fz = Math.sin(ang) * 5
        aData2.setXYZW(i, scale, tint, fx, fy)
        aFormZ.setX(i, fz)
      }
    }
    aData2.needsUpdate = true
    aFormZ.needsUpdate = true
  }

  // Formation cycle
  const formationRef = useRef<FormationKind>('free')
  const blendRef = useRef(0)
  const targetBlendRef = useRef(0)
  const switchingRef = useRef(false)
  const switchStartRef = useRef(0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f') {
        formationRef.current =
          formationRef.current === 'free' ? 'word' :
            formationRef.current === 'word' ? 'symbol' : 'free'
        targetBlendRef.current = formationRef.current === 'free' ? 0 : 1
        switchStartRef.current = performance.now()
        switchingRef.current = true
        applyFormation(formationRef.current)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
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
      uRadius: { value: radius },
      uFormationBlend: { value: 0 },
      uPatternA: { value: 0 },
      uPatternB: { value: 1 },
      uPatternBlend: { value: 0 },
      uActiveCount: { value: count }
    },
    vertexShader: `
      attribute float aPart;
      attribute vec4 aData1; // phase seed radius ySeed
      attribute vec4 aData2; // scale tint formX formY
      attribute float aFormZ;
      uniform float uTime;
      uniform float uEnergy;
      uniform float uPatternA;
      uniform float uPatternB;
      uniform float uPatternBlend;
      uniform float uFormationBlend;
      uniform float uRadius;
      uniform float uActiveCount;

      varying float vPart;
      varying float vTint;
      varying float vDepthFade;
      varying float vFormMix;

      float phase(){return aData1.x;}
      float seed(){return aData1.y;}
      float rad(){return aData1.z;}
      float yS(){return aData1.w;}
      float scaleV(){return aData2.x;}
      float tintV(){return aData2.y;}
      vec3 formPos(){return vec3(aData2.z, aData2.w, aFormZ);}

      vec3 patternPos(float pid, float ang, float r, float ys){
        if(pid<0.5){
          return vec3(cos(ang)*r,
                      sin(ang*0.8 + ys*0.3)*1.8,
                      sin(ang*1.1)*r*0.85);
        } else if(pid<1.5){
          return vec3(sin(ang)*r*0.8,
                      cos(ang*1.2 + ys*0.4)*2.4,
                      sin(ang*2.0)*r*0.4);
        } else if(pid<2.5){
          float rr = r*(0.6+0.4*sin(ang*0.25));
          float yy = mod(ang*0.3 + ys*0.5, 6.5)-3.25;
          return vec3(cos(ang)*rr, yy, sin(ang)*rr);
        } else {
          float wob = sin(uTime*0.4)*0.7;
          return vec3(cos(ang + wob)*r*0.95,
                      sin(ang*2.6 + ys)*2.5,
                      sin(ang + wob)*r*0.95);
        }
      }

      float ease(float x){return x*x*(3.0-2.0*x);}

      void main(){
        // GPU instance cull: if gl_InstanceID >= uActiveCount, push off-screen
        #ifdef GL_EXT_draw_instanced
        #endif
        if(float(gl_InstanceID) >= uActiveCount){
          gl_Position = vec4(2.0,2.0,2.0,1.0);
          return;
        }

        vPart = aPart;
        vTint = tintV();
        vFormMix = uFormationBlend;

        float speedMul = 0.32 + uEnergy*0.9;
        float ang = phase() + uTime * speedMul * (0.55 + fract(seed()*0.41));
        float r = rad();

        vec3 pA = patternPos(uPatternA, ang, r, yS());
        vec3 pB = patternPos(uPatternB, ang*1.018, r, yS());
        vec3 freePos = mix(pA, pB, uPatternBlend);

        float fm = ease(uFormationBlend);
        vec3 center = mix(freePos, formPos(), fm);

        float raw = sin(uTime*(4.0 + uEnergy*6.0) + seed());
        float flap = ease(raw*0.5+0.5)*2.0 - 1.0;

        vec3 pos = position;
        if(aPart==1.0 || aPart==2.0){
          float dir = (aPart==1.0)?-1.0:1.0;
          float hinge = flap*(0.85 + uEnergy*0.8)*dir;
          float cx=pos.x, cz=pos.z;
          float s=sin(hinge), c=cos(hinge);
          pos.x = cx*c - cz*s;
          pos.z = cx*s + cz*c;
          pos.y += sin(pos.x*dir*2.0 + hinge)*0.15;
        } else if(aPart==0.0){
          pos.y += sin(uTime*2.0 + seed())*0.02;
        }
        float roll = sin(ang + seed())*0.25*(1.0-fm*0.5);
        float cR=cos(roll), sR=sin(roll);
        pos = vec3(pos.x, pos.y*cR - pos.z*sR, pos.y*sR + pos.z*cR);
        pos *= scaleV()*(1.0 + uEnergy*0.4*(1.0-fm));

        vec3 world = center + pos;
        float dist = length(world.xz)/uRadius;
        vDepthFade = clamp(dist,0.0,1.0);

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
        vec3 albumMix = mix(uThemePrimary, uAlbumColor, 0.70);
        vec3 tint = mix(albumMix, uThemeGlow, vTint*0.78);
        float formBoost = vFormMix * 0.18;
        vec3 col = vec3(baseDim + formBoost) + tint*(0.15 + 0.42*uEnergy);
        if(vPart==1.0 || vPart==2.0){
          col += tint * 0.17;
        }
        col *= (1.0 - vDepthFade*0.35);
        float alpha = 0.9 - vDepthFade*0.45;
        if(alpha < 0.05) discard;
        gl_FragColor = vec4(col, alpha);
      }
    `
  }), [theme.ui.glow, theme.ui.primary, albumColor, radius, count])

  // Energy heuristic & pattern cycling
  const energyRef = useRef(0)
  const lastPosRef = useRef<number | null>(null)
  const velRef = useRef(0)
  const patternARef = useRef(0)
  const patternBRef = useRef(1)
  const patternStartRef = useRef(performance.now())

  useEffect(() => { patternStartRef.current = performance.now() }, [patternIntervalMs])

  // Adaptive active count (simple & stable)
  const frameTimes: number[] = []
  let lastTime = performance.now()
  const activeCountUniform = material.uniforms.uActiveCount

  useFrame(() => {
    if ((material as any).isDisposed) return
    // Basic context loss guard
    // @ts-ignore
    if (material?.program === null) return

    const now = performance.now()
    const dt = now - lastTime
    lastTime = now
    frameTimes.push(dt)
    if (frameTimes.length > 40) frameTimes.shift()
    const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
    // Lower active count if sustained > 55ms
    if (avg > 55 && activeCountUniform.value > 90) {
      activeCountUniform.value = Math.max(90, Math.floor(activeCountUniform.value * 0.9))
    }

    const uni = material.uniforms
    uni.uTime.value = now * 0.001

    // Patterns
    const elapsed = now - patternStartRef.current
    const phase = (elapsed % patternIntervalMs) / patternIntervalMs
    uni.uPatternBlend.value = Math.sin(phase * Math.PI) * 0.5 + 0.5
    if (phase < 0.02) {
      patternARef.current = patternBRef.current
      let next = patternARef.current
      while (next === patternARef.current) next = Math.floor(Math.random() * 4)
      patternBRef.current = next
      uni.uPatternA.value = patternARef.current
      uni.uPatternB.value = patternBRef.current
    }

    // Energy from playback velocity
    const pos = state?.position
    let target = 0.12
    if (typeof pos === 'number') {
      if (lastPosRef.current != null) velRef.current = pos - lastPosRef.current
      lastPosRef.current = pos
      const factor = state?.paused ? 0.3 : 1
      target = Math.min(1, velRef.current / 900 + 0.2) * factor
    }
    energyRef.current += (target - energyRef.current) * 0.08
    uni.uEnergy.value = energyRef.current

    // Formation blending
    if (switchingRef.current) {
      const t = (now - switchStartRef.current) / formationTransitionMs
      if (t >= 1) {
        blendRef.current = targetBlendRef.current
        switchingRef.current = false
      } else {
        const e = t * t * (3 - 2 * t)
        blendRef.current = THREE.MathUtils.lerp(blendRef.current, targetBlendRef.current, e)
      }
    }
    uni.uFormationBlend.value = blendRef.current

    // Album color smoothing
    ;(uni.uAlbumColor.value as THREE.Color).lerp(albumColor, 0.07)
  })

  return (
    <instancedMesh
      args={[instGeom, material, count]}
      frustumCulled={false}
    />
  )
}