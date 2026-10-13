/**
 * Casca externa do carro no formato do R8: carroceria pintada, vidros,
 * faróis em cunha, lâminas laterais, grade única hexagonal (lisa, sem emblema),
 * lanternas, aerofólio, retrovisores e rodas de 5 raios duplos.
 */
import * as THREE from 'three'
import {
  buildR8Body,
  paramPatch,
  surfacePoint,
  FRONT_AXLE,
  REAR_AXLE,
  WHEEL_R,
  WHEEL_Y,
  ARCH_R,
  TRACK,
} from './r8Body'

export interface R8Shell {
  shell: THREE.Group
  /** Peças que ficam transparentes quando a casca vira "fantasma" */
  solids: THREE.Mesh[]
  blueprint: THREE.LineSegments
  wheels: THREE.Group[]
  headlights: THREE.MeshStandardMaterial[]
  tailLights: THREE.MeshStandardMaterial[]
}

const fade = <T extends THREE.Material>(m: T) => {
  m.transparent = true
  return m
}

function honeycombTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  g.fillStyle = '#060607'
  g.fillRect(0, 0, 128, 128)
  g.strokeStyle = '#3a3c42'
  g.lineWidth = 3
  const r = 10
  const h = Math.sqrt(3) * r
  for (let row = -1; row < 10; row++) {
    for (let col = -1; col < 10; col++) {
      const cx = col * r * 3 + (row % 2 ? r * 1.5 : 0)
      const cy = row * (h / 2)
      g.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i
        g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
      }
      g.closePath()
      g.stroke()
    }
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Polígono plano (no plano YZ) voltado para +X ou -X. */
function facePlate(points: [number, number][], x: number, facing: 1 | -1, mat: THREE.Material) {
  const shape = new THREE.Shape(points.map(([z, y]) => new THREE.Vector2(z, y)))
  const geo = new THREE.ShapeGeometry(shape)
  const m = new THREE.Mesh(geo, mat)
  m.rotation.y = facing === 1 ? Math.PI / 2 : -Math.PI / 2
  m.position.x = x
  // ShapeGeometry usa (x,y); após a rotação, x vira -z (ou +z); simétrico de qualquer forma
  return m
}

function makeWheel(caliperMat: THREE.Material): THREE.Group {
  const g = new THREE.Group()
  const tireMat = new THREE.MeshStandardMaterial({ color: '#0c0c0e', roughness: 0.92, metalness: 0 })
  // Pneu de perfil baixo: toro achatado + banda
  const tread = new THREE.Mesh(new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.27, 48, 1, true), tireMat)
  tread.rotation.x = Math.PI / 2
  g.add(tread)
  for (const s of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.RingGeometry(0.27, WHEEL_R, 48), tireMat)
    wall.position.z = s * 0.135
    if (s < 0) wall.rotation.y = Math.PI
    g.add(wall)
  }

  const rimMat = new THREE.MeshStandardMaterial({ color: '#c4c8cf', metalness: 0.95, roughness: 0.22 })
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.268, 0.012, 10, 48), rimMat)
  lip.position.z = 0.13
  g.add(lip)
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.262, 0.262, 0.25, 40, 1, true), new THREE.MeshStandardMaterial({ color: '#2a2c30', metalness: 0.7, roughness: 0.5, side: THREE.DoubleSide }))
  barrel.rotation.x = Math.PI / 2
  g.add(barrel)

  // 5 raios duplos em "V"
  const spokeGeo = new THREE.BoxGeometry(0.022, 0.215, 0.03)
  spokeGeo.translate(0, 0.135, 0)
  for (let i = 0; i < 5; i++) {
    const base = (i / 5) * Math.PI * 2
    for (const d of [-0.13, 0.13]) {
      const sp = new THREE.Mesh(spokeGeo, rimMat)
      sp.rotation.z = base + d
      sp.position.z = 0.11
      sp.rotation.y = 0.12 * Math.sign(d)
      g.add(sp)
    }
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.04, 24), rimMat)
  hub.rotation.x = Math.PI / 2
  hub.position.z = 0.11
  g.add(hub)
  const cap = new THREE.Mesh(new THREE.CircleGeometry(0.035, 24), new THREE.MeshStandardMaterial({ color: '#1a1b1e', metalness: 0.6, roughness: 0.4 }))
  cap.position.z = 0.132
  g.add(cap) // tampa lisa, sem logotipo

  // Disco ventilado e pinça dourada (cor da marca RS)
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19, 0.19, 0.03, 40),
    new THREE.MeshStandardMaterial({ color: '#55585e', metalness: 0.85, roughness: 0.35 }),
  )
  disc.rotation.x = Math.PI / 2
  disc.position.z = 0.03
  g.add(disc)
  const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.07), caliperMat)
  caliper.position.set(-0.13, 0.08, 0.06)
  caliper.rotation.z = 0.5
  g.add(caliper)
  return g
}

export function buildR8Shell(): R8Shell {
  const { body, blueprint } = buildR8Body()
  const shell = new THREE.Group()
  shell.name = 'body_shell'
  const solids: THREE.Mesh[] = []
  const add = (m: THREE.Mesh) => {
    shell.add(m)
    solids.push(m)
    return m
  }

  const paint = fade(
    new THREE.MeshPhysicalMaterial({
      color: '#d2d5da',
      metalness: 0.62,
      roughness: 0.3,
      clearcoat: 1,
      clearcoatRoughness: 0.07,
      envMapIntensity: 1.15,
    }),
  )
  const glass = fade(
    new THREE.MeshPhysicalMaterial({ color: '#0b0c0f', metalness: 0.2, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 0.45 }),
  )
  const carbon = fade(new THREE.MeshStandardMaterial({ color: '#1b1c20', metalness: 0.55, roughness: 0.38 }))
  const black = fade(new THREE.MeshStandardMaterial({ color: '#060607', metalness: 0.2, roughness: 0.7 }))
  const chrome = fade(new THREE.MeshStandardMaterial({ color: '#cfd3da', metalness: 1, roughness: 0.18 }))
  const headMat = fade(new THREE.MeshPhysicalMaterial({ color: '#0b0c10', metalness: 0.4, roughness: 0.2, emissive: '#dfe8ff', emissiveIntensity: 0 }))
  const ledMat = fade(new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#f2f6ff', emissiveIntensity: 0 }))
  const tailMat = fade(new THREE.MeshStandardMaterial({ color: '#3a0606', emissive: '#ff1f1f', emissiveIntensity: 0.9, metalness: 0.4, roughness: 0.3 }))

  // Carroceria
  const bodyMesh = add(new THREE.Mesh(body, paint))
  bodyMesh.name = 'body'

  /** Recorte por máscara no espaço (x, u): o intervalo de u em cada X sai da amostragem do teste. */
  const mask = (x0: number, x1: number, u0: number, u1: number, test: (x: number, u: number) => boolean) => (x: number) => {
    let lo = -1
    let hi = -1
    const N = 240
    for (let k = 0; k <= N; k++) {
      const u = u0 + ((u1 - u0) * k) / N
      if (x >= x0 && x <= x1 && test(x, u)) {
        if (lo < 0) lo = u
        hi = u
      }
    }
    return lo < 0 || hi - lo < 1e-3 ? null : ([lo, hi] as [number, number])
  }
  const patch = (
    x0: number,
    x1: number,
    u0: number,
    u1: number,
    test: (x: number, u: number) => boolean,
    side: 1 | -1 | 0,
    offset: number,
    mat: THREE.Material,
    nx = 48,
  ) => add(new THREE.Mesh(paramPatch(x0, x1, mask(x0, x1, u0, u1, test), side, offset, nx, 16), mat))

  // Linhas do vidro (iguais dos dois lados)
  const wsLow = (x: number) => 0.835 - ((x - 0.1) / 0.92) * 0.2 // coluna A: largo embaixo, estreito em cima
  // Para-brisa
  patch(0.1, 1.02, 0.6, 1, (x, u) => u > wsLow(x), 0, 0.004, glass, 40)
  // Vigia e tampa do motor de vidro entre as colunas traseiras
  patch(-1.72, -0.62, 0.8, 1, (x, u) => u > 0.84 + Math.max(0, -1.0 - x) * 0.08, 0, 0.004, glass, 30)
  for (const side of [1, -1] as const) {
    // Janela lateral em "D": base reta na linha de cintura, coluna A e traseira em curva
    patch(
      -1.0,
      0.98,
      0.6,
      0.82,
      (x, u) => u > 0.608 && u < Math.min(0.795, wsLow(x) - 0.03, 0.608 + Math.max(0, x + 1.0) * 0.42 - Math.max(0, x + 0.55) ** 2 * 0.0),
      side,
      0.004,
      glass,
    )
    // Lâmina lateral (sideblade) atrás da porta, com entrada de ar escura
    const bladeL = (u: number) => -0.97 - (u - 0.13) * 0.3
    const bladeR = (u: number) => -0.74 - (u - 0.13) * 0.42
    patch(-1.2, -0.7, 0.12, 0.6, (x, u) => x > bladeL(u) && x < bladeR(u), side, 0.006, carbon, 30)
    patch(-1.16, -0.76, 0.3, 0.56, (x, u) => x > bladeL(u) + 0.03 && x < bladeR(u) - 0.03 && u > 0.32 && u < 0.54, side, 0.01, black, 24)
    // Saia lateral escura entre as rodas
    patch(-0.88, 0.9, 0.12, 0.2, (_x, u) => u > 0.125 && u < 0.19, side, 0.004, carbon, 40)
    // Farol em cunha no canto: borda de baixo sobe para trás, borda de dentro abre sobre o capô
    const P = new THREE.Vector3()
    const headTest = (x: number, u: number) => {
      surfacePoint(x, u, side, P)
      const back = 2.27 - x
      return P.y > 0.585 + back * 0.32 && Math.abs(P.z) > 0.52 + back * 0.55 && back < 0.5
    }
    patch(1.76, 2.27, 0.3, 0.75, headTest, side, 0.005, headMat, 36)
    // Entrada de ar lateral da frente (abaixo do farol, no canto)
    patch(2.08, 2.27, 0.15, 0.4, (x, u) => u > 0.18 && u < 0.36 - (2.27 - x) * 0.8, side, 0.005, black, 20)
    // Lanterna em cunha, dobrando a quina traseira
    patch(-2.27, -2.0, 0.42, 0.62, (x, u) => u > 0.47 + (x + 2.27) * 0.28 && u < 0.56, side, 0.005, tailMat, 20)
    // Grade traseira na lateral do para-choque
    patch(-2.27, -2.1, 0.15, 0.42, (_x, u) => u > 0.2 && u < 0.4, side, 0.004, black, 12)

    // Faixa de LED na borda de baixo do farol
    const pts: THREE.Vector3[] = []
    // Contorno de baixo do farol (busca o primeiro u que passa no teste, por X)
    for (let i = 0; i <= 20; i++) {
      const x = 1.84 + (i / 20) * 0.41
      let u = 0.3
      while (u < 0.75 && !headTest(x, u)) u += 0.002
      pts.push(surfacePoint(x, u + 0.006, side))
    }
    add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.009, 6, false), ledMat))

    // Retrovisor em gota, preso na porta perto da coluna A
    const mirror = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), paint)
    mirror.scale.set(0.12, 0.055, 0.07)
    mirror.position.set(0.84, 0.97, 0.965 * side)
    mirror.rotation.y = -0.15 * side
    add(mirror)
    const stalk = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.025, 0.14), black)
    stalk.position.set(0.88, 0.93, 0.89 * side)
    add(stalk)

    // Escapamentos ovais
    const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 24, 1, true), chrome)
    ex.rotation.z = Math.PI / 2
    ex.scale.set(1, 1, 1.6)
    ex.position.set(-2.25, 0.3, 0.5 * side)
    add(ex)
  }

  // Frente: grade única hexagonal grande (lisa, sem nenhum emblema) e entradas laterais
  const honey = honeycombTexture()
  honey.repeat.set(7, 2.6)
  const grilleMat = fade(new THREE.MeshStandardMaterial({ map: honey, metalness: 0.5, roughness: 0.5 }))
  add(
    facePlate(
      [
        [-0.38, 0.535],
        [0.38, 0.535],
        [0.47, 0.44],
        [0.46, 0.25],
        [0.4, 0.175],
        [-0.4, 0.175],
        [-0.46, 0.25],
        [-0.47, 0.44],
      ],
      2.274,
      1,
      grilleMat,
    ),
  )
  for (const sd of [1, -1]) {
    // Entrada de ar do canto, em "L"
    add(
      facePlate(
        [
          [0.55 * sd, 0.42],
          [0.62 * sd, 0.47],
          [0.77 * sd, 0.47],
          [0.78 * sd, 0.18],
          [0.5 * sd, 0.18],
        ],
        2.273,
        1,
        black,
      ),
    )
  }
  // Lâmina do para-choque (splitter)
  const splitter = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.025, 1.52), carbon)
  splitter.position.set(2.21, 0.15, 0)
  add(splitter)

  // Traseira: tela de colmeia, difusor e lanternas finas nos cantos
  const rearHoney = honeycombTexture()
  rearHoney.repeat.set(8, 2.2)
  add(
    facePlate(
      [
        [-0.74, 0.64],
        [0.74, 0.64],
        [0.78, 0.34],
        [-0.78, 0.34],
      ],
      -2.272,
      -1,
      fade(new THREE.MeshStandardMaterial({ map: rearHoney, metalness: 0.5, roughness: 0.5 })),
    ),
  )
  for (const sd of [1, -1]) {
    add(
      facePlate(
        [
          [0.3 * sd, 0.8],
          [0.82 * sd, 0.86],
          [0.83 * sd, 0.78],
          [0.34 * sd, 0.765],
        ],
        -2.273,
        -1,
        tailMat,
      ),
    )
  }
  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 1.4), carbon)
  diffuser.position.set(-2.14, 0.2, 0)
  diffuser.rotation.z = -0.12
  add(diffuser)

  // Aerofólio fixo, baixo, sobre a tampa traseira
  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.02, 1.56), carbon)
  wing.position.set(-2.12, 1.085, 0)
  wing.rotation.z = 0.07
  add(wing)
  for (const z of [-0.5, 0.5]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.018), carbon)
    post.position.set(-2.1, 1.03, z)
    add(post)
  }

  // Caixas de roda escuras
  const liner = fade(new THREE.MeshStandardMaterial({ color: '#050506', roughness: 0.95, side: THREE.DoubleSide }))
  for (const ax of [FRONT_AXLE, REAR_AXLE]) {
    for (const side of [1, -1]) {
      const l = new THREE.Mesh(new THREE.CylinderGeometry(ARCH_R - 0.01, ARCH_R - 0.01, 0.38, 36, 1, true, -Math.PI / 2, Math.PI), liner)
      l.rotation.x = -Math.PI / 2
      l.position.set(ax, WHEEL_Y, side * 0.76)
      add(l)
    }
  }

  // Planta técnica tracejada (aparece quando a casca levanta)
  const bp = new THREE.LineSegments(
    blueprint,
    new THREE.LineDashedMaterial({ color: '#c9ccd2', dashSize: 0.05, gapSize: 0.035, transparent: true, opacity: 0, depthWrite: false }),
  )
  bp.computeLineDistances()
  shell.add(bp)

  // Rodas
  const caliperMat = new THREE.MeshStandardMaterial({ color: '#d9a441', metalness: 0.5, roughness: 0.35 })
  const wheels: THREE.Group[] = []
  for (const [x, z] of [
    [FRONT_AXLE, TRACK],
    [FRONT_AXLE, -TRACK],
    [REAR_AXLE, TRACK],
    [REAR_AXLE, -TRACK],
  ] as const) {
    const w = makeWheel(caliperMat)
    w.position.set(x, WHEEL_Y, z)
    if (z < 0) w.rotation.y = Math.PI
    wheels.push(w)
  }

  return { shell, solids, blueprint: bp, wheels, headlights: [headMat, ledMat], tailLights: [tailMat] }
}
