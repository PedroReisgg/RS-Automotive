/**
 * Carroceria do cupê no formato do Audi R8 (segunda geração), modelada por
 * seções transversais ("loft"): para cada posição ao longo do carro, uma curva
 * de seção é calculada a partir de tabelas de largura e altura, e as seções são
 * costuradas numa malha lisa.
 *
 * Sem logotipo, anéis, nome de marca ou placa em nenhuma parte.
 *
 * Eixos: X = comprimento (frente em +X), Y = altura, Z = largura.
 */
import * as THREE from 'three'

type Table = [number, number][]

/** Interpolação Catmull-Rom 1D sobre uma tabela ordenada por X. */
function table(points: Table) {
  return (x: number) => {
    const n = points.length
    if (x <= points[0][0]) return points[0][1]
    if (x >= points[n - 1][0]) return points[n - 1][1]
    let i = 0
    while (i < n - 2 && x > points[i + 1][0]) i++
    const p0 = points[Math.max(0, i - 1)][1]
    const p1 = points[i][1]
    const p2 = points[i + 1][1]
    const p3 = points[Math.min(n - 1, i + 2)][1]
    const t = (x - points[i][0]) / (points[i + 1][0] - points[i][0])
    const t2 = t * t
    const t3 = t2 * t
    return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  }
}

const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

// ---------------------------------------------------------------------------
// Medidas (metros). Comprimento 4,54 m, largura 1,94 m, altura 1,23 m.
// ---------------------------------------------------------------------------
export const X_FRONT = 2.27
export const X_REAR = -2.27
export const WHEEL_R = 0.355
export const WHEEL_Y = 0.355
export const FRONT_AXLE = 1.33
export const REAR_AXLE = -1.31
export const ARCH_R = 0.41
export const TRACK = 0.8 // metade da bitola (centro do pneu)

/** Meia largura vista de cima: frente e traseira largas e retas, ancas traseiras largas. */
const halfWidth = table([
  [-2.27, 0.84],
  [-2.21, 0.92],
  [-1.95, 0.965],
  [-1.31, 0.985],
  [-0.8, 0.97],
  [0, 0.94],
  [0.8, 0.945],
  [1.33, 0.965],
  [1.8, 0.95],
  [2.08, 0.9],
  [2.2, 0.845],
  [2.27, 0.78],
])

/** Altura da linha central de cima: bico baixo, capô, para-brisa, teto e tampa do motor longa. */
const topCenter = table([
  [-2.27, 0.9],
  [-2.2, 0.965],
  [-2.0, 0.99],
  [-1.75, 1.0],
  [-1.45, 1.03],
  [-1.1, 1.09],
  [-0.8, 1.16],
  [-0.5, 1.215],
  [-0.15, 1.24],
  [0.15, 1.22],
  [0.4, 1.135],
  [0.65, 1.0],
  [0.88, 0.885],
  [1.05, 0.815],
  [1.3, 0.78],
  [1.6, 0.745],
  [1.85, 0.705],
  [2.05, 0.675],
  [2.17, 0.645],
  [2.24, 0.605],
  [2.27, 0.565],
])

/** Linha de ombro: para-lamas dianteiros acima do capô e ancas traseiras altas. */
const beltLine = table([
  [-2.27, 0.9],
  [-2.2, 0.95],
  [-1.9, 0.975],
  [-1.31, 0.965],
  [-0.9, 0.93],
  [-0.4, 0.875],
  [0.2, 0.85],
  [0.7, 0.85],
  [1.33, 0.865],
  [1.7, 0.845],
  [1.95, 0.805],
  [2.12, 0.745],
  [2.22, 0.665],
  [2.27, 0.575],
])

const bottom = table([
  [-2.27, 0.3],
  [-2.2, 0.21],
  [-1.95, 0.16],
  [1.95, 0.15],
  [2.2, 0.15],
  [2.27, 0.17],
])

/** Altura da borda do arco de roda numa posição X (0 fora dos arcos). */
export function archHeight(x: number) {
  let h = 0
  for (const ax of [FRONT_AXLE, REAR_AXLE]) {
    const d = x - ax
    if (Math.abs(d) < ARCH_R) h = Math.max(h, WHEEL_Y + Math.sqrt(ARCH_R * ARCH_R - d * d))
  }
  return h
}

/** Pontos de controle da meia seção (z >= 0), de baixo-centro até cima-centro. */
export function sectionControls(x: number): THREE.Vector3[] {
  const hw = halfWidth(x)
  const yb = bottom(x)
  const belt = beltLine(x)
  const top = topCenter(x)
  const arch = archHeight(x)
  const sill = Math.max(yb + 0.05, 0.22)
  const ySide = Math.max(sill, arch)
  const inArch = arch > 0 ? smooth(0.3, 0.6, arch) : 0

  const pts: [number, number][] = []
  pts.push([0, yb])
  // Fundo; dentro do arco vira o "teto" da caixa de roda
  pts.push([lerp(hw * 0.8, 0.6, inArch), lerp(yb, ySide - 0.015, inArch)])
  pts.push([hw * 0.965, ySide])
  pts.push([hw, lerp(ySide, belt, 0.45)])
  pts.push([hw * 0.985, belt - 0.035])
  const zs = hw * 0.93
  pts.push([zs, belt])

  // Parte de cima: mistura entre "capô/tampa" e "cabine com vidros"
  const cabin = smooth(0.06, 0.22, top - belt)
  const roofW = 0.57
  for (let k = 1; k <= 5; k++) {
    const t = k / 5
    const crown: [number, number] = [zs * (1 - t), belt + (top - belt) * (1 - (1 - t) * (1 - t))]
    let cab: [number, number]
    if (k === 1) cab = [zs * 0.95, belt + 0.03]
    else if (k === 2) cab = [lerp(zs * 0.9, roofW, 0.55), lerp(belt, top, 0.58)]
    else if (k === 3) cab = [roofW, top - 0.045]
    else if (k === 4) cab = [roofW * 0.55, top - 0.008]
    else cab = [0, top]
    pts.push([lerp(crown[0], cab[0], cabin), lerp(crown[1], cab[1], cabin)])
  }
  return pts.map(([z, y]) => new THREE.Vector3(z, y, 0))
}

// ---------------------------------------------------------------------------
// Malha
// ---------------------------------------------------------------------------

const SEG = 8 // amostras por trecho entre pontos de controle
const CONTROLS = 11
const HALF = (CONTROLS - 1) * SEG + 1 // amostras de baixo-centro a cima-centro
const RING = HALF * 2 - 2 // anel fechado (lado direito + lado esquerdo)
const STATIONS = 230

export interface BodyGrid {
  positions: Float32Array
  /** u em [0,1] (0 = baixo-centro, 0,5 = ombro, 1 = cima-centro) por amostra do anel */
  ringU: number[]
  ringSide: number[]
  stationX: number[]
}

function buildGrid(): BodyGrid {
  const positions = new Float32Array(STATIONS * RING * 3)
  const ringU: number[] = []
  const ringSide: number[] = []
  for (let i = 0; i < HALF; i++) {
    ringU.push(i / (HALF - 1))
    ringSide.push(1)
  }
  for (let i = HALF - 2; i >= 1; i--) {
    ringU.push(i / (HALF - 1))
    ringSide.push(-1)
  }
  const stationX: number[] = []
  for (let s = 0; s < STATIONS; s++) {
    // Mais estações perto das pontas, onde a forma muda rápido
    const t = s / (STATIONS - 1)
    const e = 0.5 - 0.5 * Math.cos(Math.PI * t)
    const x = lerp(X_REAR, X_FRONT, lerp(t, e, 0.35))
    stationX.push(x)
    const curve = new THREE.CatmullRomCurve3(sectionControls(x), false, 'catmullrom', 0.5)
    for (let r = 0; r < RING; r++) {
      const p = curve.getPoint(ringU[r])
      const o = (s * RING + r) * 3
      positions[o] = x
      positions[o + 1] = p.y
      positions[o + 2] = p.x * ringSide[r]
    }
  }
  return { positions, ringU, ringSide, stationX }
}

const GRID = buildGrid()

function bodyGeometry(): THREE.BufferGeometry {
  const { positions } = GRID
  const index: number[] = []
  for (let s = 0; s < STATIONS - 1; s++) {
    for (let r = 0; r < RING; r++) {
      const a = s * RING + r
      const b = s * RING + ((r + 1) % RING)
      const c = (s + 1) * RING + r
      const d = (s + 1) * RING + ((r + 1) % RING)
      index.push(a, c, b, b, c, d)
    }
  }
  // Tampas da frente e da traseira (leque a partir do centro), com vértices
  // próprios para a aresta ficar viva
  const verts = Array.from(positions)
  for (const [s, flip] of [
    [0, true],
    [STATIONS - 1, false],
  ] as const) {
    let cy = 0
    for (let r = 0; r < RING; r++) cy += positions[(s * RING + r) * 3 + 1]
    cy /= RING
    const first = verts.length / 3
    for (let r = 0; r < RING; r++) verts.push(positions[(s * RING + r) * 3], positions[(s * RING + r) * 3 + 1], positions[(s * RING + r) * 3 + 2])
    const center = verts.length / 3
    verts.push(GRID.stationX[s], cy, 0)
    for (let r = 0; r < RING; r++) {
      const a = first + r
      const b = first + ((r + 1) % RING)
      if (flip) index.push(center, a, b)
      else index.push(center, b, a)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  geo.setIndex(index)
  geo.computeVertexNormals()
  return geo
}

const curveCache = new Map<number, THREE.CatmullRomCurve3>()
function sectionCurve(x: number) {
  const k = Math.round(x * 1e4)
  let c = curveCache.get(k)
  if (!c) {
    if (curveCache.size > 6000) curveCache.clear()
    c = new THREE.CatmullRomCurve3(sectionControls(x), false, 'catmullrom', 0.5)
    curveCache.set(k, c)
  }
  return c
}

/** Ponto na superfície (lado +Z ou -Z) numa posição X e parâmetro u (0 = baixo-centro, 1 = cima-centro). */
export function surfacePoint(x: number, u: number, side: 1 | -1, out = new THREE.Vector3()) {
  const p = sectionCurve(x).getPoint(Math.min(1, Math.max(0, u)))
  return out.set(x, p.y, p.x * side)
}

const _a = new THREE.Vector3()
const _b = new THREE.Vector3()
const _c = new THREE.Vector3()
const _d = new THREE.Vector3()

/** Normal para fora da carroceria num ponto (x, u). */
export function surfaceNormal(x: number, u: number, side: 1 | -1, out = new THREE.Vector3()) {
  const e = 0.004
  surfacePoint(x + e, u, side, _a).sub(surfacePoint(x - e, u, side, _b))
  surfacePoint(x, Math.min(1, u + e), side, _c).sub(surfacePoint(x, Math.max(0, u - e), side, _d))
  out.crossVectors(_c, _a).normalize()
  surfacePoint(x, u, side, _b)
  if (out.x * 0 + out.y * (_b.y - 0.6) + out.z * _b.z < 0 && Math.abs(_b.z) + Math.abs(_b.y - 0.6) > 0.05) out.negate()
  if (!Number.isFinite(out.x)) out.set(0, 1, 0)
  return out
}

/**
 * Recorte da superfície (vidros, faróis, lâmina lateral...) gerado direto no
 * espaço (x, u): bordas lisas, sem degraus. `range(x)` dá o intervalo de u em
 * cada X (ou null). side 0 = os dois lados (peças que cruzam o centro).
 */
export function paramPatch(
  x0: number,
  x1: number,
  range: (x: number) => [number, number] | null,
  side: 1 | -1 | 0,
  offset: number,
  nx = 48,
  nu = 14,
): THREE.BufferGeometry {
  const verts: number[] = []
  const index: number[] = []
  const p = new THREE.Vector3()
  const n = new THREE.Vector3()
  for (const sd of side === 0 ? ([1, -1] as const) : ([side] as const)) {
    const cols: (number | null)[] = []
    for (let i = 0; i <= nx; i++) {
      const x = lerp(x0, x1, i / nx)
      const rg = range(x)
      if (!rg || rg[1] - rg[0] < 1e-4) {
        cols.push(null)
        continue
      }
      cols.push(verts.length / 3)
      for (let j = 0; j <= nu; j++) {
        const u = lerp(rg[0], rg[1], j / nu)
        surfacePoint(x, u, sd, p)
        surfaceNormal(x, u, sd, n)
        verts.push(p.x + n.x * offset, p.y + n.y * offset, p.z + n.z * offset)
      }
    }
    for (let i = 0; i < nx; i++) {
      const c0 = cols[i]
      const c1 = cols[i + 1]
      if (c0 === null || c1 === null) continue
      for (let j = 0; j < nu; j++) {
        const a = c0 + j
        const b = c0 + j + 1
        const c = c1 + j
        const d = c1 + j + 1
        // u cresce para cima; x para a frente. No lado +Z, (x, u) é anti-horário visto de fora.
        if (sd === 1) index.push(a, c, b, b, c, d)
        else index.push(a, b, c, b, d, c)
      }
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  geo.setIndex(index)
  geo.computeVertexNormals()
  return geo
}

/** Linhas de "planta técnica": seções transversais e longitudinais. */
function blueprintLines(): THREE.BufferGeometry {
  const { positions, stationX } = GRID
  const seg: number[] = []
  const push = (k1: number, k2: number) =>
    seg.push(positions[k1 * 3], positions[k1 * 3 + 1], positions[k1 * 3 + 2], positions[k2 * 3], positions[k2 * 3 + 1], positions[k2 * 3 + 2])
  // seções a cada ~22 cm
  let last = -99
  for (let s = 0; s < STATIONS; s++) {
    if (stationX[s] - last < 0.22 && s !== STATIONS - 1) continue
    last = stationX[s]
    for (let r = 0; r < RING; r += 2) push(s * RING + r, s * RING + ((r + 2) % RING))
  }
  // longitudinais
  for (const u of [0.3, 0.5, 0.62, 0.78, 1]) {
    for (const side of [1, -1]) {
      const r = side === 1 ? Math.round(u * (HALF - 1)) : RING - Math.round(u * (HALF - 1))
      if (r <= 0 || r >= RING) continue
      for (let s = 0; s < STATIONS - 1; s++) push(s * RING + r, (s + 1) * RING + r)
      if (u === 1) break
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3))
  return geo
}

export interface R8Body {
  body: THREE.BufferGeometry
  blueprint: THREE.BufferGeometry
}

export function buildR8Body(): R8Body {
  return { body: bodyGeometry(), blueprint: blueprintLines() }
}
