/**
 * Modelo 3D procedural do carro (cupê esportivo de motor central).
 *
 * Construído só com geometrias do three.js, sem nenhum arquivo externo:
 * não existe logotipo, emblema, placa ou nome de marca em nenhuma peça.
 *
 * Eixos: X = comprimento (frente em +X), Y = altura, Z = largura (direita em +Z).
 * Escala em metros, origem no centro do carro, no chão.
 */
import * as THREE from 'three'
import { buildR8Shell } from './r8Shell'

export const GOLD = new THREE.Color('#D9A441')

/** Peças nomeadas, usadas pela timeline de rolagem. */
export interface CarParts {
  root: THREE.Group
  shell: THREE.Group
  shellSolids: THREE.Mesh[]
  blueprint: THREE.LineSegments
  headlights: THREE.MeshStandardMaterial[]
  tailLights: THREE.MeshStandardMaterial[]
  wheels: THREE.Group[]
  chassis: THREE.Group
  harness: THREE.Mesh[]
  battery: THREE.Group
  batteryCable: THREE.Mesh
  alternator: THREE.Group
  engineBlock: THREE.Group
  heads: THREE.Group
  intake: THREE.Group
  injectors: THREE.Group
  ecu: THREE.Mesh
  starter: THREE.Group
  starterArrows: THREE.Group
  dash: THREE.Group
  headUnit: THREE.Group
  lockModules: THREE.Mesh[]
  windowMotors: THREE.Mesh[]
  windowPanes: THREE.Mesh[]
  alarmSiren: THREE.Mesh
  speakers: THREE.Mesh[]
  amp: THREE.Mesh
  soundWaves: THREE.Mesh[]
  /** Materiais que recebem o brilho dourado, agrupados por sistema. */
  glow: Record<GlowKey, THREE.MeshStandardMaterial[]>
}

export type GlowKey =
  | 'harness'
  | 'battery'
  | 'alternator'
  | 'injection'
  | 'ecu'
  | 'starter'
  | 'cable'
  | 'cabin'
  | 'sound'

// ---------------------------------------------------------------------------
// Materiais e utilitários
// ---------------------------------------------------------------------------

function partMat(color = '#5a5f69', metalness = 0.55, roughness = 0.45) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness,
    roughness,
    emissive: GOLD.clone(),
    emissiveIntensity: 0,
  })
}


// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  m.position.set(x, y, z)
  return m
}

function tube(points: [number, number, number][], radius: number, mat: THREE.Material) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)))
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 80, radius, 8, false), mat)
}

/** Linhas tracejadas da "carroceria fantasma". */

// ---------------------------------------------------------------------------
// Montagem
// ---------------------------------------------------------------------------

export function buildCar(): CarParts {
  const root = new THREE.Group()
  root.name = 'car'

  const glow: CarParts['glow'] = {
    harness: [],
    battery: [],
    alternator: [],
    injection: [],
    ecu: [],
    starter: [],
    cable: [],
    cabin: [],
    sound: [],
  }

  // ---------------- Carroceria (casca no formato do R8) ----------------
  const r8 = buildR8Shell()
  const shell = r8.shell
  root.add(shell)
  const wheels = r8.wheels
  wheels.forEach((w) => root.add(w))

  // ---------------- Chassi ----------------
  const chassis = new THREE.Group()
  chassis.name = 'chassis'
  const frameMat = partMat('#33363d', 0.35, 0.7)
  chassis.add(box(3.7, 0.04, 1.5, frameMat, 0, 0.19, 0))
  for (const z of [-0.62, 0.62]) chassis.add(box(3.9, 0.08, 0.08, frameMat, 0, 0.25, z))
  for (const x of [1.32, -1.3]) chassis.add(box(0.08, 0.08, 1.5, frameMat, x, 0.3, 0))
  // Bancos
  const seatMat = partMat('#26282d', 0.1, 0.8)
  for (const z of [-0.36, 0.36]) {
    chassis.add(box(0.5, 0.12, 0.46, seatMat, -0.12, 0.36, z))
    const back = box(0.12, 0.6, 0.46, seatMat, -0.42, 0.66, z)
    back.rotation.z = 0.22
    chassis.add(back)
  }
  // Volante (lado esquerdo = -Z)
  const wheelSteer = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.02, 10, 32), partMat('#1d1f23', 0.3, 0.6))
  wheelSteer.position.set(0.28, 0.8, -0.36)
  wheelSteer.rotation.y = Math.PI / 2
  wheelSteer.rotation.x = 0.35
  chassis.add(wheelSteer)
  root.add(chassis)

  // ---------------- Chicote elétrico principal ----------------
  const harnessMat = partMat('#2a2c31', 0.2, 0.6)
  glow.harness.push(harnessMat)
  const harness = [
    tube([[1.9, 0.42, 0.4], [1.2, 0.3, 0.55], [0.3, 0.26, 0.58], [-0.6, 0.28, 0.52], [-1.4, 0.45, 0.42], [-1.9, 0.7, 0.3]], 0.018, harnessMat),
    tube([[1.9, 0.42, -0.4], [1.0, 0.3, -0.55], [0.3, 0.26, -0.56], [-0.6, 0.3, -0.5], [-1.5, 0.5, -0.4], [-1.95, 0.75, -0.3]], 0.016, harnessMat),
    tube([[1.65, 0.5, 0], [1.1, 0.55, 0.1], [0.55, 0.7, 0.2], [0.1, 0.4, 0.3], [-0.5, 0.32, 0.4]], 0.014, harnessMat),
  ]
  harness.forEach((h) => root.add(h))

  // ---------------- Bateria (porta-malas dianteiro) ----------------
  const battery = new THREE.Group()
  battery.name = 'battery'
  const batMat = partMat('#2d3038', 0.3, 0.55)
  glow.battery.push(batMat)
  battery.add(box(0.32, 0.22, 0.2, batMat))
  const termMat = partMat('#c9933b', 0.9, 0.3)
  glow.battery.push(termMat)
  for (const z of [-0.06, 0.06]) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.05, 12), termMat)
    t.position.set(0.08, 0.13, z)
    battery.add(t)
  }
  battery.position.set(1.65, 0.42, -0.05)
  root.add(battery)

  // ---------------- Motor (central traseiro) ----------------
  const engineBlock = new THREE.Group()
  engineBlock.name = 'engine_block'
  const blockMat = partMat('#50545d', 0.75, 0.38)
  engineBlock.add(box(0.95, 0.42, 0.62, blockMat))
  // Cárter
  engineBlock.add(box(0.85, 0.1, 0.5, partMat('#3a3d44', 0.7, 0.4), 0, -0.25, 0))
  engineBlock.position.set(-1.2, 0.52, 0)
  root.add(engineBlock)

  const heads = new THREE.Group()
  heads.name = 'cylinder_heads'
  for (const s of [-1, 1]) {
    const h = box(0.92, 0.12, 0.3, blockMat, 0, 0, s * 0.25)
    h.rotation.x = s * 0.42
    heads.add(h)
  }
  heads.position.set(-1.2, 0.78, 0)
  root.add(heads)

  const intake = new THREE.Group()
  intake.name = 'intake'
  const intakeMat = partMat('#666b75', 0.8, 0.3)
  glow.injection.push(intakeMat)
  intake.add(box(0.82, 0.08, 0.26, intakeMat))
  const plenum = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 20), intakeMat)
  plenum.rotation.z = Math.PI / 2
  plenum.position.y = 0.09
  intake.add(plenum)
  intake.position.set(-1.2, 0.88, 0)
  root.add(intake)

  const injectors = new THREE.Group()
  injectors.name = 'injectors'
  const injMat = partMat('#9c8a64', 0.8, 0.3)
  glow.injection.push(injMat)
  for (let i = 0; i < 4; i++) {
    for (const z of [-0.16, 0.16]) {
      const inj = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.016, 0.12, 12), injMat)
      inj.position.set(-0.33 + i * 0.22, 0, z)
      inj.rotation.x = z > 0 ? -0.35 : 0.35
      injectors.add(inj)
    }
  }
  // Rail de combustível
  for (const z of [-0.16, 0.16]) {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.78, 10), injMat)
    rail.rotation.z = Math.PI / 2
    rail.position.set(0, 0.07, z)
    injectors.add(rail)
  }
  injectors.position.set(-1.2, 0.8, 0)
  root.add(injectors)

  const ecuMat = partMat('#2b2e34', 0.4, 0.5)
  glow.ecu.push(ecuMat)
  const ecu = box(0.26, 0.05, 0.18, ecuMat, -0.68, 0.86, -0.5)
  ecu.name = 'ecu'
  root.add(ecu)

  // ---------------- Alternador ----------------
  const alternator = new THREE.Group()
  alternator.name = 'alternator'
  const altMat = partMat('#8d9099', 0.85, 0.3)
  glow.alternator.push(altMat)
  const altBody = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.16, 24), altMat)
  altBody.rotation.z = Math.PI / 2
  alternator.add(altBody)
  const pulley = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 20), altMat)
  pulley.rotation.z = Math.PI / 2
  pulley.position.x = 0.1
  alternator.add(pulley)
  alternator.position.set(-0.72, 0.62, 0.38)
  root.add(alternator)

  // ---------------- Motor de partida ----------------
  const starter = new THREE.Group()
  starter.name = 'starter'
  const starterMat = partMat('#7b7f88', 0.85, 0.3)
  glow.starter.push(starterMat)
  const stBody = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.24, 20), starterMat)
  stBody.rotation.z = Math.PI / 2
  starter.add(stBody)
  const solenoid = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 14), starterMat)
  solenoid.rotation.z = Math.PI / 2
  solenoid.position.set(0.02, 0.08, 0)
  starter.add(solenoid)
  starter.position.set(-0.82, 0.34, -0.36)
  root.add(starter)

  // Setas indicativas do motor de partida
  const starterArrows = new THREE.Group()
  const arrowMat = new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0 })
  for (const [x, y, rz] of [
    [-0.82, 0.62, Math.PI],
    [-0.5, 0.34, Math.PI / 2],
    [-1.14, 0.34, -Math.PI / 2],
  ] as const) {
    const a = new THREE.Group()
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.09, 16), arrowMat)
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.12, 8), arrowMat)
    stem.position.y = 0.1
    a.add(cone, stem)
    a.position.set(x, y, -0.36)
    a.rotation.z = rz
    starterArrows.add(a)
  }
  root.add(starterArrows)

  // Cabo da bateria até o motor de partida
  const cableMat = partMat('#3a1c1c', 0.2, 0.6)
  glow.cable.push(cableMat)
  const batteryCable = tube(
    [[1.6, 0.52, -0.1], [1.3, 0.32, -0.3], [0.6, 0.24, -0.46], [-0.2, 0.24, -0.46], [-0.7, 0.3, -0.4]],
    0.017,
    cableMat,
  )
  root.add(batteryCable)

  // ---------------- Cabine: painel, central, travas, vidros, alarme ----------------
  const dash = new THREE.Group()
  dash.name = 'dash'
  const dashMat = partMat('#2a2c31', 0.2, 0.7)
  glow.cabin.push(dashMat)
  dash.add(box(0.32, 0.16, 1.42, dashMat))
  dash.position.set(0.56, 0.74, 0)
  root.add(dash)

  const headUnit = new THREE.Group()
  headUnit.name = 'head_unit'
  const huMat = partMat('#1c1d21', 0.4, 0.4)
  glow.sound.push(huMat)
  headUnit.add(box(0.05, 0.15, 0.26, huMat))
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.22, 0.12),
    new THREE.MeshStandardMaterial({ color: '#0a1424', emissive: '#3f6fb5', emissiveIntensity: 0.9 }),
  )
  screen.rotation.y = -Math.PI / 2
  screen.position.x = -0.027
  headUnit.add(screen)
  headUnit.position.set(0.4, 0.74, 0)
  root.add(headUnit)

  const lockMat = partMat('#3c4048', 0.6, 0.4)
  const motorMat = partMat('#6c707a', 0.85, 0.3)
  glow.cabin.push(lockMat, motorMat)
  const lockModules: THREE.Mesh[] = []
  const windowMotors: THREE.Mesh[] = []
  const windowPanes: THREE.Mesh[] = []
  const paneMat = new THREE.MeshPhysicalMaterial({ color: '#9fb2c8', transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.2 })
  for (const z of [-0.8, 0.8]) {
    const lock = box(0.1, 0.08, 0.05, lockMat, -0.25, 0.55, z)
    lockModules.push(lock)
    const wm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 20), motorMat)
    wm.rotation.x = Math.PI / 2
    wm.position.set(0.18, 0.62, z)
    windowMotors.push(wm)
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.3), paneMat)
    pane.position.set(0.0, 0.98, z * 1.04)
    windowPanes.push(pane)
    root.add(lock, wm, pane)
  }

  const sirenMat = partMat('#b04a3a', 0.4, 0.5)
  glow.cabin.push(sirenMat)
  const alarmSiren = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 18), sirenMat)
  alarmSiren.rotation.z = -Math.PI / 2
  alarmSiren.position.set(1.85, 0.45, 0.48)
  alarmSiren.name = 'alarm_siren'
  root.add(alarmSiren)

  // ---------------- Som: alto-falantes, amplificador e ondas ----------------
  const spkMat = partMat('#1a1b1f', 0.3, 0.6)
  glow.sound.push(spkMat)
  const speakers: THREE.Mesh[] = []
  const speakerSpots: [number, number, number, number][] = [
    [0.2, 0.42, -0.82, -1],
    [0.2, 0.42, 0.82, 1],
    [0.66, 0.84, -0.58, -1],
    [0.66, 0.84, 0.58, 1],
  ]
  for (const [x, y, z] of speakerSpots) {
    const r = y > 0.6 ? 0.04 : 0.085
    const s = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.7, 0.05, 24), spkMat)
    s.rotation.x = Math.PI / 2
    s.position.set(x, y, z)
    speakers.push(s)
    root.add(s)
  }
  const ampMat = partMat('#30333a', 0.6, 0.4)
  glow.sound.push(ampMat)
  const amp = box(0.3, 0.05, 0.22, ampMat, -0.6, 0.3, 0)
  amp.name = 'amp'
  root.add(amp)

  const soundWaves: THREE.Mesh[] = []
  const waveMat = new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
  for (const [x, y, z, dir] of speakerSpots.slice(0, 2)) {
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.112, 48), waveMat.clone())
      ring.position.set(x, y, z + dir * 0.06)
      ring.userData = { phase: i / 3, dir, baseZ: z + dir * 0.06 }
      soundWaves.push(ring)
      root.add(ring)
    }
  }

  return {
    root,
    shell,
    shellSolids: r8.solids,
    blueprint: r8.blueprint,
    headlights: r8.headlights,
    tailLights: r8.tailLights,
    wheels,
    chassis,
    harness,
    battery,
    batteryCable,
    alternator,
    engineBlock,
    heads,
    intake,
    injectors,
    ecu,
    starter,
    starterArrows,
    dash,
    headUnit,
    lockModules,
    windowMotors,
    windowPanes,
    alarmSiren,
    speakers,
    amp,
    soundWaves,
    glow,
  }
}
