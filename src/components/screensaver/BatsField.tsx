/**
 * Packed-attribute bat swarm & formations (Free / Belisario / Bat Symbol).
 * Fix for "Too many attributes" on constrained mobile GPUs.
 *
 * Attribute packing:
 *  aCore1 (vec4) = phase, seed, radius, ySeed
 *  aCore2 (vec4) = scale, tint, formX, formY
 *  aFormZ (float)= formation Z
 *
 * Press 'F' (while screensaver active) to cycle formations.
 */
import React, { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
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
  const { gl } = useThree()

  // Detect attribute budget & auto-reduce complexity if very low
  const maxAttribs = useMemo(() => gl.getParameter(gl.MAX_VERTEX_ATTRIBS) as number, [gl])
  const effectiveCount = maxAttribs < 10 ? Math.min(140, count) : count

  const albumColor = useMemo(() => {
    try {
      return new THREE.Color(albumHex || theme.ui.primary)
    } catch {
      return new THREE.Color(theme.ui.primary)
    }
  }, [albumHex, theme.ui.primary])

  const baseGeom = useMemo(
    () =>
      // Slightly fewer wing segments if attribute budget is tiny
      createMegaBatGeometry({
        wingSegments: maxAttribs < 10 ? 7 : 9,
        wingSpan: 3.4
      }),
    [maxAttribs]
  )

  // Formation cycle
  const formation = useRef<FormationKind>('free')
  const formationBlend = useRef(0)
  const switchingRef = useRef(false)
  const switchStartRef = useRef(0)
  const formationTargetBlend = useRef(0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f') {
        if (formation.current === 'free') formation.current = 'word'
        else if (formation.current === 'word') formation.current = 'symbol'
        else formation.current = 'free'
        formationTargetBlend.current = formation.current === 'free' ? 0 : 1
        switchStartRef.current = performance.now()
        switchingRef.current = true
        applyFormationPoints() // rewrite formation coords
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // WORD / SYMBOL point caches
  const wordPointsRef = useRef<THREE.Vector3[]>([])
  const symbolPointsRef = useRef<THREE.Vector3[]>([])

  function makeWordPoints(word: string, target: number) {
    const canvas = document.createElement('canvas')
    const W = 640, H = 160
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 118px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(word, W / 2, H / 2)
    const data = ctx.getImageData(0, 0, W, H).data
    const pts: THREE.Vector3[] = []
    const step = 4
    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        const i = (y * W + x) * 4
        if (data[i] > 180) {
          pts.push(
            new THREE.Vector3(
              ((x / W) - 0.5) * 44,
              ((0.5 - y / H)) * 14,
              0
            )
          )
        }
      }
    }
    // Sample down or pad
    if (pts.length > target) {
      const s: THREE.Vector3[] = []
      for (let i = 0; i < target; i++) s.push(pts[Math.floor((i / target) * pts.length)])
      return s
    } else if (pts.length < target) {
      while (pts.length < target) {
        pts.push(
          pts[Math.floor(Math.random() * pts.length)].clone().add(
            new THREE.Vector3((Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.4)
          )
        )
      }
    }
    return pts
  }

  function makeSymbolPoints(target: number) {
    // Coarse mask -> bigger amplitude -> more iconic
    const mask = [
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
    const rows = mask.length
    const cols = mask[0].length
    const pts: THREE.Vector3[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (mask[r][c] === '#') {
          const x = (c / cols - 0.5) * 44
          const y = (0.5 - r / rows) * 14
          pts.push(new THREE.Vector3(x + (Math.random() - 0.5) * 0.5, y + (Math.random() - 0.5) * 0.4, 0))
        }
      }
    }
    // Adapt length
    if (pts.length > target) {
      const s: THREE.Vector3[] = []
      for (let i = 0; i < target; i++) s.push(pts[Math.floor((i / target) * pts.length)])
      return s
    } else if (pts.length < target) {
      while (pts.length < target) {
        pts.push(
          pts[Math.floor(Math.random() * pts.length)].clone().add(
            new THREE.Vector3((Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.3)
          )
        )
      }
    }
    return pts
  }

  function bakePoints() {
    wordPointsRef.current = makeWordPoints('Belisario', effectiveCount)
    symbolPointsRef.current = makeSymbolPoints(effectiveCount)
  }

  useEffect(() => {
    bakePoints()
  }, [effectiveCount])

  // Instanced packed geometry
  const instGeom = useMemo(() => {
    const g = baseGeom.clone()
    const core1 = new Float32Array(effectiveCount * 4) // phase, seed, radius, ySeed
    const core2 = new Float32Array(effectiveCount * 4) // scale, tint, formX, formY
    const formZ = new Float32Array(effectiveCount)     // formation Z
    const aPart = g.getAttribute('aPart') // keep

    for (let i = 0; i < effectiveCount; i++) {
      const phase = Math.random() * Math.PI * 2
      const seed = Math.random() * 1000
      const rad = radius * (0.35 + Math.random() * 0.65)
      const ySeed = (Math.random() - 0.5) * 14
      const scale = 0.95 + Math.random() * 1.4
      const tint = Math.random()
      core1.set([phase, seed, rad, ySeed], i * 4)
      // formation (temporary; will be overwritten through applyFormationPoints)
      core2.set([scale, tint, 0, 0], i * 4)
      formZ[i] = 0
      // aPart already in base geometry
    }

    g.setAttribute('aCore1', new THREE.InstancedBufferAttribute(core1, 4))
    g.setAttribute('aCore2', new THREE.InstancedBufferAttribute(core2, 4))
    g.setAttribute('aFormZ', new THREE.InstancedBufferAttribute(formZ, 1))
    return g
  }, [baseGeom, effectiveCount, radius])

  function applyFormationPoints() {
    // choose which point set corresponds to current formation
    const formPts =
      formation.current === 'word'
        ? wordPointsRef.current
        : formation.current === 'symbol'
          ? symbolPointsRef.current
          : null
    const aCore2 = instGeom.getAttribute('aCore2') as THREE.InstancedBufferAttribute
    const aFormZ = instGeom.getAttribute('aFormZ') as THREE.InstancedBufferAttribute
    if (!formPts) {
      // keep previous but no change; free mode uses blend 0
      return
    }
    for (let i = 0; i < aCore2.count; i++) {
      const baseIndex = i * 4
      if (i < formPts.length) {
        const pt = formPts[i]
        // aCore2: [scale, tint, formX, formY]
        const scale = aCore2.getX(i)
        const tint = aCore2.getY(i)
        aCore2.setXYZW(
          i,
          scale,
          tint,
          pt.x,
          pt.y
        )
        aFormZ.setX(i, pt.z)
      } else {
        // ornamental ring
        const ang = (i / aCore2.count) * Math.PI * 2
        const fx = Math.cos(ang) * (radius + 4)
        const fy = Math.sin(ang * 2) * 6
        const fz = Math.sin(ang) * 6
        const scale = aCore2.getX(i)
        const tint = aCore2.getY(i)
        aCore2.setXYZW(i, scale, tint, fx, fy)
        aFormZ.setX(i, fz)
      }
    }
    aCore2.needsUpdate = true
    aFormZ.needsUpdate = true
  }

  // Pre-bake both sets (so switching uses already baked data)
  useEffect(() => {
    applyFormationPoints()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instGeom])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
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
          attribute vec4 aCore1; // phase, seed, radius, ySeed
          attribute vec4 aCore2; // scale, tint, formX, formY
          attribute float aFormZ;

          uniform float uTime;
          uniform float uEnergy;
          uniform float uPatternA;
          uniform float uPatternB;
          uniform float uPatternBlend;
          uniform float uRadiusGlobal;
          uniform float uFormationBlend;

          varying float vPart;
          varying float vTint;
          varying float vDepthFade;
          varying float vFormMix;

          // Extractors
          float phase() { return aCore1.x; }
          float seed() { return aCore1.y; }
          float radius() { return aCore1.z; }
          float ySeed() { return aCore1.w; }
          float scaleVal() { return aCore2.x; }
          float tint() { return aCore2.y; }
          vec3 formPos() { return vec3(aCore2.z, aCore2.w, aFormZ); }

          vec3 patternPos(float pid, float baseAng, float r, float yS) {
            if(pid < 0.5){
              return vec3(
                cos(baseAng)*r,
                sin(baseAng*0.8 + yS*0.3)*1.8,
                sin(baseAng*1.1)*r*0.85
              );
            } else if (pid < 1.5) {
              return vec3(
                sin(baseAng)*r*0.8,
                cos(baseAng*1.2 + yS*0.4)*2.4,
                sin(baseAng*2.0)*r*0.4
              );
            } else if (pid < 2.5) {
              float rr = r*(0.6+0.4*sin(baseAng*0.25));
              float y = mod(baseAng*0.3 + yS*0.5, 6.5)-3.25;
              return vec3(cos(baseAng)*rr, y, sin(baseAng)*rr);
            } else {
              float wob = sin(uTime*0.4)*0.7;
              return vec3(
                cos(baseAng + wob)*r*0.95,
                sin(baseAng*2.6 + yS)*2.5,
                sin(baseAng + wob)*r*0.95
              );
            }
          }
          float smoothCubic(float x){ return x*x*(3.0-2.0*x); }

          void main(){
            vPart = aPart;
            vTint = tint();
            vFormMix = uFormationBlend;

            float speedMul = 0.33 + uEnergy*0.9;
            float baseAng = phase() + uTime * speedMul * (0.55 + fract(seed()*0.41));
            float r = radius();

            vec3 pA = patternPos(uPatternA, baseAng, r, ySeed());
            vec3 pB = patternPos(uPatternB, baseAng*1.018, r, ySeed());
            vec3 freePos = mix(pA, pB, uPatternBlend);

            float fm = smoothCubic(uFormationBlend);
            vec3 center = mix(freePos, formPos(), fm);

            // Smooth flap
            float raw = sin(uTime*(4.0 + uEnergy*6.0) + seed());
            float flap = smoothCubic(raw*0.5 + 0.5)*2.0 - 1.0;
            vec3 pos = position;

            if(aPart == 1.0 || aPart == 2.0){
              float dir = (aPart == 1.0) ? -1.0 : 1.0;
              float hinge = flap * (0.85 + uEnergy*0.8) * dir;
              float cx = pos.x, cz = pos.z;
              float s = sin(hinge), c = cos(hinge);
              pos.x = cx*c - cz*s;
              pos.z = cx*s + cz*c;
              pos.y += sin(pos.x*dir*2.0 + hinge)*0.15;
            } else if (aPart == 0.0){
              pos.y += sin(uTime*2.0 + seed())*0.02;
            }
            // Gentle roll
            float roll = sin(baseAng + seed())*0.25*(1.0-fm*0.5);
            float cR = cos(roll), sR = sin(roll);
            pos = vec3(pos.x, pos.y*cR - pos.z*sR, pos.y*sR + pos.z*cR);

            pos *= scaleVal() * (1.0 + uEnergy*0.4*(1.0-fm));

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
            vec3 albumMix = mix(uThemePrimary, uAlbumColor, 0.70);
            vec3 tint = mix(albumMix, uThemeGlow, vTint*0.78);
            float formBoost = vFormMix * 0.18;
            vec3 col = vec3(baseDim + formBoost) + tint*(0.15 + 0.42*uEnergy);
            if(vPart == 1.0 || vPart == 2.0){
              col += tint * 0.17;
            }
            col *= (1.0 - vDepthFade*0.35);
            float alpha = 0.9 - vDepthFade*0.45;
            if(alpha < 0.05) discard;
            gl_FragColor = vec4(col, alpha);
          }
        `
      }),
    [theme.ui.glow, theme.ui.primary, albumColor, radius]
  )

  // Playback heuristic energy (fallback)
  const energyRef = useRef(0)
  const lastPosRef = useRef<number | null>(null)
  const velRef = useRef(0)

  // Pattern cycling (still used for free mode)
  const patternARef = useRef(0)
  const patternBRef = useRef(1)
  const patternStartRef = useRef(performance.now())

  useEffect(() => {
    patternStartRef.current = performance.now()
  }, [patternIntervalMs])

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
      let nxt = patternARef.current
      while (nxt === patternARef.current) nxt = Math.floor(Math.random() * 4)
      patternBRef.current = nxt
      uni.uPatternA.value = patternARef.current
      uni.uPatternB.value = patternBRef.current
    }

    // Energy
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

    // Formation blend easing
    if (switchingRef.current) {
      const elapsed = now - switchStartRef.current
      if (elapsed >= formationTransitionMs) {
        formationBlend.current = formationTargetBlend.current
        switchingRef.current = false
      } else {
        const k = elapsed / formationTransitionMs
        const eased = k * k * (3 - 2 * k)
        formationBlend.current = THREE.MathUtils.lerp(
          formationBlend.current,
          formationTargetBlend.current,
          eased
        )
      }
    }
    uni.uFormationBlend.value = formationBlend.current

    // Smooth album color
    ;(uni.uAlbumColor.value as THREE.Color).lerp(albumColor, 0.07)
  })

  return (
    <instancedMesh
      args={[instGeom, material, effectiveCount]}
      frustumCulled={false}
    />
  )
}