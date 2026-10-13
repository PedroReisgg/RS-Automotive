/**
 * Cena fixa do início: o hero e as 8 etapas do carro dividem o mesmo canvas.
 * A seção fica presa (pin) e o progresso da rolagem (scrub) controla uma
 * timeline GSAP de 8 unidades: a unidade 0 é o hero, as unidades 1 a 7 levam
 * da etapa 1 (carro inteiro) até a etapa 8 (remontagem e orçamento).
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { animate } from 'motion'
import { CarViewer, BASE_STATE, type SceneState } from './three/viewer'
import { STAGES, STAGE_PERCENT } from './data'

gsap.registerPlugin(ScrollTrigger)

type Keyframe = Partial<SceneState>

const closed: Keyframe = {
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
const opened: Keyframe = { ...closed, open: 1, ghost: 1, harness: 0.25 }

function keyframes(mobile: boolean): Keyframe[] {
  // No desktop o carro vai para a direita (texto à esquerda);
  // no celular ele sobe (texto embaixo).
  const side = mobile ? { shiftX: 0, shiftY: -0.16 } : { shiftX: 0.16, shiftY: 0 }
  return [
    // Hero: três quartos baixo, carro à direita do título
    {
      ...closed,
      camX: 5.6,
      camY: 0.95,
      camZ: -3.7,
      tX: 0.1,
      tY: 0.55,
      tZ: 0,
      hero: 1,
      shiftX: mobile ? 0 : 0.2,
      shiftY: mobile ? -0.17 : 0.02,
    },
    // 1. Carro inteiro
    { ...closed, ...BASE_STATE, ...side, hero: 0 },
    // 2. Carroceria aberta: câmera sobe e recua, chicote acende
    { ...opened, ...side, harness: 1, camX: 5.4, camY: 4.4, camZ: 5.6, tX: 0, tY: 0.7, tZ: 0 },
    // 3. Bateria (frente) e alternador
    { ...opened, ...side, battery: 1, alternator: 1, camX: 4.1, camY: 2.9, camZ: 3.3, tX: 0.35, tY: 0.55, tZ: 0.1 },
    // 4. Injeção: lateral traseira, perto do motor central
    { ...opened, ...side, injection: 1, camX: -3.6, camY: 2.3, camZ: 2.9, tX: -1.1, tY: 0.8, tZ: 0 },
    // 5. Motor de partida: câmera baixa olhando para cima
    { ...opened, ...side, starter: 1, camX: -0.1, camY: 0.2, camZ: -3.9, tX: -0.6, tY: 0.5, tZ: 0 },
    // 6. Cabine, vidros, travas e alarme: por cima
    { ...opened, ...side, cabin: 1, camX: 2.0, camY: 5.0, camZ: 3.0, tX: 0.2, tY: 0.55, tZ: 0 },
    // 7. Som e acessórios: lateral
    { ...opened, ...side, sound: 1, camX: 0.6, camY: 1.7, camZ: 6.4, tX: 0.1, tY: 0.6, tZ: 0 },
    // 8. Remontagem: volta aos três quartos
    { ...closed, ...side, camX: BASE_STATE.camX, camY: BASE_STATE.camY, camZ: BASE_STATE.camZ, tX: 0, tY: 0.5, tZ: 0 },
  ]
}

export interface SceneApi {
  viewer: CarViewer
  /** Rola até a etapa i (0 a 7). */
  goToStage: (i: number) => void
}

export function initScene(section: HTMLElement, scrollTo: (y: number) => void): SceneApi {
  const stage = section.querySelector<HTMLElement>('[data-scene-stage]')!
  const canvas = section.querySelector<HTMLCanvasElement>('[data-scene-canvas]')!
  const heroUi = section.querySelector<HTMLElement>('[data-hero-ui]')!
  const storyUi = section.querySelector<HTMLElement>('[data-story-ui]')!
  const cue = section.querySelector<HTMLElement>('[data-scroll-cue]')
  const bgWord = section.querySelector<HTMLElement>('[data-bg-word]')
  const hex = section.querySelector<SVGElement>('[data-hex]')
  const counter = section.querySelector<HTMLElement>('[data-story-counter]')!
  const title = section.querySelector<HTMLElement>('[data-story-title]')!
  const text = section.querySelector<HTMLElement>('[data-story-text]')!
  const tag = section.querySelector<HTMLElement>('[data-story-tag]')!
  const cta = section.querySelector<HTMLAnchorElement>('[data-story-cta]')!
  const copy = section.querySelector<HTMLElement>('[data-story-copy]')!
  const bar = section.querySelector<HTMLElement>('[data-story-bar]')!
  const steps = Array.from(section.querySelectorAll<HTMLButtonElement>('[data-story-step]'))

  const viewer = new CarViewer(canvas)
  const state = viewer.state
  const UNITS = 8

  let current = -1
  const showStage = (i: number, instant = false) => {
    if (i === current) return
    current = i
    const s = STAGES[i]
    const swap = () => {
      counter.textContent = `Etapa ${i + 1} de 8 · ${STAGE_PERCENT[i]}%`
      title.textContent = s.title
      text.textContent = s.text
      tag.textContent = s.tag
      const isLast = i === STAGES.length - 1
      cta.hidden = !(s.service || isLast)
      cta.dataset.service = s.service ?? ''
      const label = isLast ? 'Pedir orçamento no WhatsApp' : 'Orçamento deste serviço'
      const t = cta.querySelector<HTMLElement>('.btn-text')!
      t.textContent = label
      t.dataset.text = label
      cta.classList.toggle('is-final', isLast)
      steps.forEach((b, j) => {
        b.classList.toggle('is-active', j === i)
        b.classList.toggle('is-done', j < i)
        b.setAttribute('aria-current', j === i ? 'step' : 'false')
      })
    }
    if (instant) return swap()
    animate(copy, { opacity: 0, y: 10, filter: 'blur(4px)' }, { duration: 0.16 }).then(() => {
      swap()
      animate(copy, { opacity: 1, y: 0, filter: 'blur(0px)' }, { duration: 0.4, ease: [0.22, 1, 0.36, 1] })
    })
  }
  showStage(0, true)

  let trigger: ScrollTrigger | undefined
  let timeline: gsap.core.Timeline | undefined
  const stageToY = (i: number) => {
    if (!trigger) return 0
    return trigger.start + (trigger.end - trigger.start) * ((i + 1) / UNITS)
  }

  const mm = gsap.matchMedia()
  mm.add({ mobile: '(max-aspect-ratio: 1/1)', desktop: '(min-aspect-ratio: 1001/1000)' }, (ctx) => {
    const mobile = !!ctx.conditions?.mobile
    const K = keyframes(mobile)

    const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } })
    timeline = tl
    tl.set(state, K[0], 0)
    for (let i = 1; i < K.length; i++) {
      tl.to(state, { ...K[i], duration: 0.62 }, i - 1 + 0.19)
    }
    // Interface: o hero sai cedo, as etapas entram
    tl.to(heroUi, { autoAlpha: 0, y: -60, duration: 0.45, ease: 'power2.in' }, 0.05)
    if (cue) tl.to(cue, { autoAlpha: 0, duration: 0.2 }, 0)
    tl.fromTo(storyUi, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0.55)
    if (bgWord) tl.fromTo(bgWord, { xPercent: 0 }, { xPercent: -35, duration: UNITS, ease: 'none' }, 0)
    if (hex) tl.to(hex, { yPercent: -18, opacity: 0.35, duration: 2, ease: 'none' }, 0)
    tl.to({}, { duration: 0.01 }, UNITS - 0.01)

    trigger = ScrollTrigger.create({
      trigger: section,
      pin: stage,
      start: 'top top',
      end: () => `+=${window.innerHeight * (mobile ? 7 : 9)}`,
      scrub: 0.7,
      animation: tl,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onToggle: (self) => {
        viewer.setActive(self.isActive)
        document.documentElement.classList.toggle('story-active', self.isActive && self.progress > 1 / UNITS / 2)
      },
      onUpdate: (self) => {
        const u = self.progress * UNITS
        bar.style.transform = `scaleX(${gsap.utils.clamp(0, 1, (u - 1) / (UNITS - 1))})`
        document.documentElement.classList.toggle('story-active', self.isActive && u > 0.5)
        showStage(gsap.utils.clamp(0, 7, Math.round(u) - 1))
      },
    })

    return () => {
      trigger?.kill()
      tl.kill()
    }
  })

  const goToStage = (i: number) => scrollTo(Math.ceil(stageToY(i)) + 2)
  steps.forEach((b, i) => (b.onclick = () => goToStage(i)))

  // Captura de imagens estáticas (fallback): ?capture=N (1 a 8)
  const capture = new URLSearchParams(location.search).get('capture')
  if (capture !== null) {
    const n = Number(capture)
    trigger?.kill()
    timeline?.progress(n / UNITS).pause()
    state.shiftX = 0
    state.shiftY = 0
    state.hero = 0
    showStage(Math.max(0, n - 1), true)
    viewer.renderNow()
    document.documentElement.dataset.captureReady = 'true'
  }

  return { viewer, goToStage }
}
