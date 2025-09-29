/**
 * Procedurally creates a compact bat geometry combining:
 *  - Body fuselage (capsule-like)
 *  - Head + ears
 *  - Wings (left/right) with membrane curvature
 *  - Tiny legs
 *
 * Vertex attributes:
 *  - position
 *  - normal
 *  - aPart (0 = body/head, 1 = left wing, 2 = right wing, 3 = legs)
 *
 * Keep vertex count low for large instancing.
 */
import * as THREE from 'three'

export interface BatGeometryOptions {
  facesPerWing?: number   // horizontal subdivisions for wing membrane
  wingSpan?: number       // half-span; total span ~ 2 * wingSpan
  wingDepth?: number      // front-back (z) thickness suggestion
  bodyLength?: number
  bodyRadius?: number
  headRadius?: number
  earHeight?: number
  legLength?: number
}

const DEFAULTS: BatGeometryOptions = {
  facesPerWing: 8,
  wingSpan: 2.2,
  wingDepth: 0.05,
  bodyLength: 1.2,
  bodyRadius: 0.28,
  headRadius: 0.32,
  earHeight: 0.28,
  legLength: 0.35
}

/**
 * Build a bat silhouette; emphasis on side & overhead silhouette.
 */
export function createBatGeometry(opts: Partial<BatGeometryOptions> = {}) {
  const {
    facesPerWing,
    wingSpan,
    wingDepth,
    bodyLength,
    bodyRadius,
    headRadius,
    earHeight,
    legLength
  } = { ...DEFAULTS, ...opts }

  const positions: number[] = []
  const normals: number[] = []
  const aPart: number[] = []

  const pushTri = (ax: number, ay: number, az: number,
                   bx: number, by: number, bz: number,
                   cx: number, cy: number, cz: number,
                   part: number) => {
    // Triangle
    positions.push(ax, ay, az, bx, by, bz, cx, cy, cz)
    // Normal
    const vA = new THREE.Vector3(ax, ay, az)
    const vB = new THREE.Vector3(bx, by, bz)
    const vC = new THREE.Vector3(cx, cy, cz)
    const n = new THREE.Vector3()
    n.subVectors(vC, vB).cross(new THREE.Vector3().subVectors(vA, vB)).normalize()
    for (let i = 0; i < 3; i++) {
      normals.push(n.x, n.y, n.z)
      aPart.push(part)
    }
  }

  // 1) Body: simple double-ring capsule (front/back triangles)
  const halfBody = bodyLength * 0.5
  const bodySegments = 6
  for (let i = 0; i < bodySegments; i++) {
    const t0 = (i / bodySegments) * Math.PI * 2
    const t1 = ((i + 1) / bodySegments) * Math.PI * 2
    const x0 = Math.cos(t0) * bodyRadius
    const y0 = Math.sin(t0) * bodyRadius
    const x1 = Math.cos(t1) * bodyRadius
    const y1 = Math.sin(t1) * bodyRadius
    // front cap (center front at +halfBody z)
    pushTri(0, 0, halfBody, x0, y0, 0, x1, y1, 0, 0)
    // back cap (center back at -halfBody z)
    pushTri(0, 0, -halfBody, x1, y1, 0, x0, y0, 0, 0)
  }

  // 2) Head (simple sphere wedge approximated by a low poly “cap”)
  const headSegments = 6
  for (let i = 0; i < headSegments; i++) {
    const t0 = (i / headSegments) * Math.PI * 2
    const t1 = ((i + 1) / headSegments) * Math.PI * 2
    const hx0 = Math.cos(t0) * headRadius
    const hy0 = Math.sin(t0) * headRadius + bodyRadius * 0.4
    const hx1 = Math.cos(t1) * headRadius
    const hy1 = Math.sin(t1) * headRadius + bodyRadius * 0.4
    const hz = halfBody + headRadius * 0.5
    pushTri(0, bodyRadius * 0.4, hz, hx0, hy0, halfBody * 0.3, hx1, hy1, halfBody * 0.3, 0)
  }

  // 3) Ears (two simple triangles)
  const earZ = halfBody + headRadius * 0.2
  const earOffsetX = headRadius * 0.45
  const earWidth = headRadius * 0.5
  // left ear
  pushTri(-earOffsetX, bodyRadius * 0.7, earZ,
    -earOffsetX - earWidth * 0.5, bodyRadius * 0.7, earZ,
    -earOffsetX - earWidth * 0.25, bodyRadius * 0.7 + earHeight, earZ, 0)
  // right ear
  pushTri(earOffsetX, bodyRadius * 0.7, earZ,
    earOffsetX + earWidth * 0.5, bodyRadius * 0.7, earZ,
    earOffsetX + earWidth * 0.25, bodyRadius * 0.7 + earHeight, earZ, 0)

  // 4) Legs (two tiny triangles downward)
  const legZ = -halfBody * 0.3
  const legSpread = bodyRadius * 0.5
  pushTri(-legSpread * 0.5, -bodyRadius * 0.2, legZ,
          -legSpread, -bodyRadius * 0.2 - legLength, legZ,
          0, -bodyRadius * 0.2 - legLength * 0.4, legZ, 3)

  pushTri(legSpread * 0.5, -bodyRadius * 0.2, legZ,
          0, -bodyRadius * 0.2 - legLength * 0.4, legZ,
          legSpread, -bodyRadius * 0.2 - legLength, legZ, 3)

  // 5) Wings: curved membrane (left & right)
  // We'll build as triangle fan from shoulder outward.
  const shoulderY = 0.15
  const shoulderZ = 0
  const wingHeight = bodyRadius * 1.1
  const arc = Math.PI * 0.9
  const buildWing = (sign: number) => {
    const partId = sign < 0 ? 1 : 2
    const baseX = sign * bodyRadius
    for (let i = 0; i < facesPerWing; i++) {
      const t0 = i / facesPerWing
      const t1 = (i + 1) / facesPerWing
      const ang0 = -arc / 2 + arc * t0
      const ang1 = -arc / 2 + arc * t1
      // curvature for membrane (outer points further + slight down)
      const span0 = t0 * wingSpan
      const span1 = t1 * wingSpan
      const x0 = baseX + sign * span0
      const x1 = baseX + sign * span1
      const y0 = shoulderY + Math.sin(ang0) * wingHeight
      const y1 = shoulderY + Math.sin(ang1) * wingHeight
      const z0 = shoulderZ + Math.cos(ang0) * wingDepth * span0
      const z1 = shoulderZ + Math.cos(ang1) * wingDepth * span1

      // Tri (shoulder, p0, p1)
      pushTri(baseX, shoulderY, shoulderZ, x0, y0, z0, x1, y1, z1, partId)
    }
  }
  buildWing(-1)
  buildWing(1)

  // Build BufferGeometry
  const geometry = new THREE.BufferGeometry()
  const posArr = new Float32Array(positions)
  const normArr = new Float32Array(normals)
  const partArr = new Float32Array(aPart)
  geometry.setAttribute('position', new THREE.BufferAttribute(posArr, 3))
  geometry.setAttribute('normal', new THREE.BufferAttribute(normArr, 3))
  geometry.setAttribute('aPart', new THREE.BufferAttribute(partArr, 1))
  geometry.computeBoundingSphere()
  return geometry
}