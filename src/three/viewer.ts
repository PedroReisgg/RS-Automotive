/**
 * Visualizador three.js do carro: uma única cena fixa que serve ao hero e às
 * 8 etapas da rolagem. O estado (câmera, peças, luzes) é controlado pela
 * timeline do GSAP; o mouse só mexe o carro enquanto o hero está na tela.
 *
 * Só renderiza quando está visível e a aba está ativa.
 */
import * as THREE from 'three'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js'
import { buildCar, type CarParts, type GlowKey } from './carModel'
import { studioEnvironment } from './studioEnv'

export interface SceneState {
  camX: number
  camY: number
  camZ: number
  tX: number
  tY: number
  tZ: number
  /** Deslocamento do carro na tela (fração da largura/altura), para abrir espaço ao texto */
  shiftX: number
  shiftY: number
  /** 1 no hero (mouse mexe o carro), 0 nas etapas */
  hero: number
  /** Intensidade dos faróis (acendem na abertura) */
  lights: number
  /** 0 = casca fechada, 1 = casca levantada */
  open: number
  /** 0 = pintura sólida, 1 = casca fantasma tracejada */
  ghost: number
  harness: number
  battery: number
  alternator: number
  injection: number
  starter: number
  cabin: number
  sound: number
}

export const BASE_STATE: SceneState = {
  camX: 5.0,
  camY: 1.5,
  camZ: -4.4,
  tX: 0,
  tY: 0.5,
  tZ: 0,
  shiftX: 0,
  shiftY: 0,
  hero: 0,
  lights: 1,
  open: 0,
  ghost: 0,
  harness: 0,
  battery: 0,
  alternator: 0,
  injection: 0,
  starter: 0,
  cabin: 0,
  sound: 0,
}

export class CarViewer {
  readonly state: SceneState = { ...BASE_STATE }
  readonly isSmall: boolean
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private car: CarParts
  private clock = new THREE.Clock()
  private running = false
  private visible = false
  private forced = false
  private raf = 0
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 }
  private maxDpr: number
  private dpr: number
  private frameTimes: number[] = []
  private tmp = new THREE.Vector3()
  private reflector?: Reflector

  constructor(private canvas: HTMLCanvasElement) {
    this.isSmall = window.matchMedia('(max-width: 767px)').matches
    // Limite de densidade de pixels: 2 no desktop, 1,5 no celular
    this.maxDpr = this.isSmall ? 1.5 : 2
    this.dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr)

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: new URLSearchParams(location.search).has('capture'),
    })
    this.renderer.setPixelRatio(this.dpr)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    this.scene.environment = studioEnvironment(this.renderer)
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.05, 80)

    this.addLights()
    this.addFloor()

    this.car = buildCar()
    this.scene.add(this.car.root)

    this.resize()
    this.renderNow()

    new ResizeObserver(() => this.resize()).observe(canvas)
    new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting
      this.updateLoop()
    }).observe(canvas)
    document.addEventListener('visibilitychange', () => this.updateLoop())
    window.addEventListener(
      'pointermove',
      (e) => {
        this.pointer.tx = (e.clientX / window.innerWidth) * 2 - 1
        this.pointer.ty = (e.clientY / window.innerHeight) * 2 - 1
      },
      { passive: true },
    )
  }

  /** Força o loop ligado (a cena fixa avisa pelo ScrollTrigger quando está ativa). */
  setActive(active: boolean) {
    this.forced = active
    this.updateLoop()
  }

  /** Renderiza um quadro imediatamente. */
  renderNow() {
    this.applyState(this.clock.getElapsedTime())
    this.renderer.render(this.scene, this.camera)
  }

  /** Projeta um ponto do carro para pixels do canvas (etiquetas do hero). */
  project(point: THREE.Vector3, out: { x: number; y: number }) {
    this.tmp.copy(point).applyMatrix4(this.car.root.matrixWorld).project(this.camera)
    out.x = (this.tmp.x * 0.5 + 0.5) * this.canvas.clientWidth
    out.y = (-this.tmp.y * 0.5 + 0.5) * this.canvas.clientHeight
    return out
  }

  onFrame?: () => void

  // -------------------------------------------------------------------------

  private addLights() {
    this.scene.add(new THREE.HemisphereLight('#e6e9ef', '#101012', 0.35))
    const key = new THREE.DirectionalLight('#ffffff', 1.6)
    key.position.set(2, 7, 3)
    this.scene.add(key)
    const rim = new THREE.DirectionalLight('#f4d9a6', 0.9)
    rim.position.set(-6, 2.2, -3)
    this.scene.add(rim)
    const fill = new THREE.DirectionalLight('#b9c4d8', 0.45)
    fill.position.set(-1, 1.2, 6)
    this.scene.add(fill)
  }

  private addFloor() {
    // Reflexo do chão só no desktop (custa um segundo render)
    if (!this.isSmall) {
      this.reflector = new Reflector(new THREE.PlaneGeometry(16, 16), {
        textureWidth: 1024,
        textureHeight: 1024,
        color: new THREE.Color('#7a7a80'),
      })
      this.reflector.rotation.x = -Math.PI / 2
      this.scene.add(this.reflector)
    }

    // Véu do chão: escurece o reflexo e some nas bordas
    const size = 512
    const c = document.createElement('canvas')
    c.width = c.height = size
    const g = c.getContext('2d')!
    const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    grad.addColorStop(0, 'rgba(23,23,26,0.78)')
    grad.addColorStop(0.45, 'rgba(23,23,26,0.9)')
    grad.addColorStop(1, 'rgba(23,23,26,1)')
    g.fillStyle = grad
    g.fillRect(0, 0, size, size)
    const veil = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }),
    )
    veil.rotation.x = -Math.PI / 2
    veil.position.y = 0.002
    veil.renderOrder = 1
    if (!this.isSmall) this.scene.add(veil)

    // Sombra de contato
    const s = 256
    const sc = document.createElement('canvas')
    sc.width = sc.height = s
    const sg = sc.getContext('2d')!
    const sgrad = sg.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
    sgrad.addColorStop(0, 'rgba(0,0,0,0.85)')
    sgrad.addColorStop(0.6, 'rgba(0,0,0,0.4)')
    sgrad.addColorStop(1, 'rgba(0,0,0,0)')
    sg.fillStyle = sgrad
    sg.fillRect(0, 0, s, s)
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(5.4, 2.7),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }),
    )
    shadow.rotation.x = -Math.PI / 2
    shadow.position.y = 0.004
    shadow.renderOrder = 2
    this.scene.add(shadow)

    // Anel dourado no chão
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(3.3, 3.312, 160),
      new THREE.MeshBasicMaterial({ color: '#d9a441', transparent: true, opacity: 0.22, side: THREE.DoubleSide }),
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.006
    this.scene.add(ring)
  }

  private resize() {
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    if (!w || !h) return
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    if (!this.running) this.renderNow()
  }

  private updateLoop() {
    const shouldRun = (this.visible || this.forced) && !document.hidden
    if (shouldRun && !this.running) {
      this.running = true
      this.clock.getDelta()
      this.raf = requestAnimationFrame(this.tick)
    } else if (!shouldRun && this.running) {
      this.running = false
      cancelAnimationFrame(this.raf)
    }
  }

  private tick = () => {
    if (!this.running) return
    const dt = this.clock.getDelta()
    this.adaptQuality(dt)
    this.applyState(this.clock.elapsedTime)
    this.renderer.render(this.scene, this.camera)
    this.onFrame?.()
    this.raf = requestAnimationFrame(this.tick)
  }

  /** Reduz a densidade de pixels se o quadro ficar lento. */
  private adaptQuality(dt: number) {
    this.frameTimes.push(dt)
    if (this.frameTimes.length < 50) return
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
    this.frameTimes = []
    if (avg > 1 / 40 && this.dpr > 1) {
      this.dpr = Math.max(1, this.dpr - 0.25)
      this.renderer.setPixelRatio(this.dpr)
      this.resize()
    }
  }

  // -------------------------------------------------------------------------
  // Estado -> cena
  // -------------------------------------------------------------------------

  private glow(key: GlowKey, value: number) {
    for (const m of this.car.glow[key]) m.emissiveIntensity = value
  }

  private applyState(t: number) {
    const s = this.state
    const c = this.car
    const pulse = 0.55 + 0.45 * Math.sin(t * 4)

    // Câmera: afasta em telas estreitas para o carro caber
    const aspect = this.camera.aspect
    const fit = aspect < 1.3 ? Math.min(2.8, 1.5 / aspect) : 1
    this.tmp.set(s.camX - s.tX, s.camY - s.tY, s.camZ - s.tZ).multiplyScalar(fit)
    this.camera.position.set(s.tX + this.tmp.x, s.tY + this.tmp.y, s.tZ + this.tmp.z)
    this.camera.lookAt(s.tX, s.tY, s.tZ)
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    if (w && h) this.camera.setViewOffset(w, h, -s.shiftX * w, -s.shiftY * h, w, h)

    // Hero: giro leve somado ao mouse
    this.pointer.x += (this.pointer.tx - this.pointer.x) * 0.05
    this.pointer.y += (this.pointer.ty - this.pointer.y) * 0.05
    const deg = THREE.MathUtils.degToRad
    c.root.rotation.y = s.hero * (Math.sin(t * 0.3) * deg(3) + this.pointer.x * deg(5))
    c.root.rotation.x = s.hero * this.pointer.y * deg(0.8)

    // Faróis e lanternas
    c.headlights.forEach((m, i) => (m.emissiveIntensity = s.lights * (i === 0 ? 0.05 : 3.2)))
    for (const m of c.tailLights) m.emissiveIntensity = 0.4 + s.lights * 0.8

    // Casca: sobe e vira planta técnica tracejada
    c.shell.position.y = s.open * 0.75
    const solidOpacity = 1 - s.ghost * 0.95
    const seen = new Set<THREE.Material>()
    for (const m of c.shellSolids) {
      const mat = m.material as THREE.Material & { opacity: number }
      if (!seen.has(mat)) {
        seen.add(mat)
        mat.opacity = solidOpacity
        mat.depthWrite = solidOpacity > 0.6
      }
      m.visible = solidOpacity > 0.02
    }
    ;(c.blueprint.material as THREE.LineDashedMaterial).opacity = s.ghost * 0.85
    c.blueprint.visible = s.ghost > 0.01
    if (this.reflector) this.reflector.visible = s.camY > 0.3

    this.glow('harness', s.harness * pulse * 1.4)

    // Etapa 3: bateria e alternador
    c.battery.position.set(1.65 + s.battery * 0.25, 0.42 + s.battery * 0.4, -0.05)
    this.glow('battery', s.battery * pulse * 0.8)
    c.alternator.position.set(-0.72, 0.62 + s.alternator * 0.3, 0.38 + s.alternator * 0.5)
    c.alternator.rotation.x = t * 3 * s.alternator
    this.glow('alternator', s.alternator * pulse * 0.8)

    // Etapa 4: injeção em camadas, módulo pisca (1,5 Hz, abaixo do limite de flashes)
    c.heads.position.y = 0.78 + s.injection * 0.1
    c.injectors.position.y = 0.8 + s.injection * 0.26
    c.intake.position.y = 0.88 + s.injection * 0.52
    this.glow('injection', s.injection * pulse * 0.7)
    const blink = Math.sin(t * Math.PI * 3) > 0 ? 1 : 0.15
    this.glow('ecu', s.injection * blink * 1.4)
    c.ecu.position.y = 0.86 + s.injection * 0.32

    // Etapa 5: motor de partida sai do bloco e o cabo acende
    c.starter.position.z = -0.36 - s.starter * 0.42
    c.starterArrows.position.z = -s.starter * 0.42
    c.starterArrows.children.forEach((a, i) => {
      const mesh = a.children[0] as THREE.Mesh
      ;(mesh.material as THREE.MeshBasicMaterial).opacity = s.starter * (0.55 + 0.45 * Math.sin(t * 5 + i))
    })
    c.starterArrows.visible = s.starter > 0.01
    this.glow('starter', s.starter * pulse * 0.9)
    this.glow('cable', s.starter * (0.8 + 0.4 * pulse) * 1.6)

    // Etapa 6: cabine, vidros, travas e alarme
    c.dash.position.y = 0.74 + s.cabin * 0.12
    c.lockModules.forEach((m) => (m.position.z = Math.sign(m.position.z) * (0.8 + s.cabin * 0.38)))
    c.windowMotors.forEach((m) => {
      m.position.z = Math.sign(m.position.z) * (0.8 + s.cabin * 0.32)
      m.rotation.y = t * 4 * s.cabin
    })
    c.windowPanes.forEach((p) => {
      p.position.y = 0.98 - s.cabin * (0.12 + 0.12 * Math.sin(t * 1.4))
    })
    c.alarmSiren.position.y = 0.45 + s.cabin * 0.34
    this.glow('cabin', s.cabin * pulse * 0.6)

    // Etapa 7: som, ondas sonoras douradas
    c.speakers.forEach((m, i) => {
      const side = Math.sign(m.position.z)
      const base = i < 2 ? 0.82 : 0.58
      m.position.z = side * (base + s.sound * 0.2)
    })
    c.headUnit.position.y = 0.74 + s.sound * 0.22
    c.amp.position.y = 0.3 + s.sound * 0.25
    this.glow('sound', s.sound * pulse * 0.7)
    for (const ring of c.soundWaves) {
      const { phase, dir, baseZ } = ring.userData as { phase: number; dir: number; baseZ: number }
      const p = (t * 0.7 + phase) % 1
      ring.visible = s.sound > 0.01
      ring.scale.setScalar(1 + p * 3.2)
      ring.position.z = baseZ + dir * (s.sound * 0.2 + p * 0.25)
      ;(ring.material as THREE.MeshBasicMaterial).opacity = s.sound * (1 - p) * 0.9
    }

    // Rodas giram de leve quando a cena está aberta
    for (const w of c.wheels) w.rotation.z = -t * 0.6 * s.open * Math.sign(w.position.z)
  }
}
