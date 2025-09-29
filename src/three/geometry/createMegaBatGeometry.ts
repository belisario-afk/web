/**
 * Higher fidelity instanced bat geometry for silhouette & formation viewing.
 * Features:
 *  - Multi-segment curved wings (membrane + finger tip)
 *  - Body capsule + tapered tail point
 *  - Head sphere cap + ears
 *  - Small feet nubs
 * Attributes:
 *  - position
 *  - normal
 *  - aPart: 0 body/head, 1 left wing, 2 right wing, 3 feet
 */
import * as THREE from 'three'

export interface MegaBatOptions {
  wingSegments?: number
  wingSpan?: number
  wingChord?: number
  bodyRadius?: number
  bodyLength?: number
  headRadius?: number
  earHeight?: number
  legLength?: number
  tailTaper?: number
}

const D: Required<MegaBatOptions> = {
  wingSegments: 7,
  wingSpan: 3.2,
  wingChord: 0.55,
  bodyRadius: 0.32,
  bodyLength: 1.4,
  headRadius: 0.36,
  earHeight: 0.34,
  legLength: 0.35,
  tailTaper: 0.45
}

export function createMegaBatGeometry(opts: Partial<MegaBatOptions> = {}) {
  const o = { ...D, ...opts }
  const positions: number[] = []
  const normals: number[] = []
  const parts: number[] = []

  const pushTri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, part: number) => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z)
    const n = new THREE.Vector3().subVectors(c, b).cross(new THREE.Vector3().subVectors(a, b)).normalize()
    for (let i = 0; i < 3; i++) {
      normals.push(n.x, n.y, n.z)
      parts.push(part)
    }
  }

  // Body capsule (front / back fans) simple low poly ring
  const ring = 8
  const half = o.bodyLength * 0.5
  for (let i = 0; i < ring; i++) {
    const t0 = (i / ring) * Math.PI * 2
    const t1 = ((i + 1) / ring) * Math.PI * 2
    const r = o.bodyRadius
    const p0 = new THREE.Vector3(Math.cos(t0) * r, Math.sin(t0) * r, 0)
    const p1 = new THREE.Vector3(Math.cos(t1) * r, Math.sin(t1) * r, 0)
    // front cap
    pushTri(new THREE.Vector3(0, 0, half), p0, p1, 0)
    // back cap (taper slightly for tail)
    const tb = new THREE.Vector3(0, 0, -half * (1 + o.tailTaper * 0.2))
    pushTri(tb, p1.clone().setZ(0), p0.clone().setZ(0), 0)
  }

  // Tail small triangle
  const tailBase = new THREE.Vector3(0, -o.bodyRadius * 0.4, -half * (1 + o.tailTaper * 0.2))
  pushTri(
    tailBase,
    tailBase.clone().add(new THREE.Vector3(-0.18, -o.tailTaper, -o.tailTaper * 0.3)),
    tailBase.clone().add(new THREE.Vector3(0.18, -o.tailTaper, -o.tailTaper * 0.3)),
    0
  )

  // Head + ears (simple)
  const headSeg = 8
  const headZ = half + o.headRadius * 0.35
  for (let i = 0; i < headSeg; i++) {
    const t0 = (i / headSeg) * Math.PI * 2
    const t1 = ((i + 1) / headSeg) * Math.PI * 2
    const hr = o.headRadius
    const center = new THREE.Vector3(0, o.bodyRadius * 0.4, headZ)
    const p0 = new THREE.Vector3(Math.cos(t0) * hr, o.bodyRadius * 0.4 + Math.sin(t0) * hr, headZ - hr * 0.35)
    const p1 = new THREE.Vector3(Math.cos(t1) * hr, o.bodyRadius * 0.4 + Math.sin(t1) * hr, headZ - hr * 0.35)
    pushTri(center, p0, p1, 0)
  }
  // Ears
  const earBaseY = o.bodyRadius * 0.9
  const earZ = headZ - o.headRadius * 0.2
  const earW = o.headRadius * 0.6
  const offset = o.headRadius * 0.55
  const leftEarA = new THREE.Vector3(-offset, earBaseY, earZ)
  const leftEarB = leftEarA.clone().add(new THREE.Vector3(-earW * 0.4, 0, 0))
  const leftEarC = leftEarA.clone().add(new THREE.Vector3(-earW * 0.2, o.earHeight, 0))
  pushTri(leftEarA, leftEarB, leftEarC, 0)
  const rightEarA = new THREE.Vector3(offset, earBaseY, earZ)
  const rightEarB = rightEarA.clone().add(new THREE.Vector3(earW * 0.4, 0, 0))
  const rightEarC = rightEarA.clone().add(new THREE.Vector3(earW * 0.2, o.earHeight, 0))
  pushTri(rightEarA, rightEarB, rightEarC, 0)

  // Feet
  const legZ = -half * 0.2
  pushTri(
    new THREE.Vector3(-0.18, -o.bodyRadius * 0.1, legZ),
    new THREE.Vector3(-0.42, -o.bodyRadius * 0.1 - o.legLength, legZ),
    new THREE.Vector3(0, -o.bodyRadius * 0.1 - o.legLength * 0.5, legZ),
    3
  )
  pushTri(
    new THREE.Vector3(0.18, -o.bodyRadius * 0.1, legZ),
    new THREE.Vector3(0, -o.bodyRadius * 0.1 - o.legLength * 0.5, legZ),
    new THREE.Vector3(0.42, -o.bodyRadius * 0.1 - o.legLength, legZ),
    3
  )

  // Wings (curved membrane subdivisions)
  const addWing = (sign: number) => {
    for (let i = 0; i < o.wingSegments; i++) {
      const t0 = i / o.wingSegments
      const t1 = (i + 1) / o.wingSegments
      const span0 = t0 * o.wingSpan
      const span1 = t1 * o.wingSpan
      // curvature profile along y
      const curve = (t: number) => Math.sin(t * Math.PI) // arch
      const y0 = curve(t0) * 0.9
      const y1 = curve(t1) * 0.9
      const base = new THREE.Vector3(sign * 0.15, 0.05, 0)
      const p0 = new THREE.Vector3(sign * span0, y0, (t0 - 0.5) * o.wingChord)
      const p1 = new THREE.Vector3(sign * span1, y1, (t1 - 0.5) * o.wingChord)
      // triangle fan strips
      pushTri(base, p0, p1, sign < 0 ? 1 : 2)
      // membrane extra (taper bottom)
      const p0b = p0.clone().add(new THREE.Vector3(0, -0.4 - y0 * 0.25, 0))
      const p1b = p1.clone().add(new THREE.Vector3(0, -0.4 - y1 * 0.25, 0))
      pushTri(p0, p0b, p1b, sign < 0 ? 1 : 2)
      pushTri(p0, p1b, p1, sign < 0 ? 1 : 2)
    }
  }
  addWing(-1)
  addWing(1)

  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geom.setAttribute('aPart', new THREE.Float32BufferAttribute(parts, 1))
  geom.computeBoundingSphere()
  return geom
}