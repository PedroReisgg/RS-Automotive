import './style.css'
import 'lenis/dist/lenis.css'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { animate, hover, press } from 'motion'
import {
  createIcons,
  ArrowDown,
  ArrowUpRight,
  BatteryCharging,
  BellRing,
  Check,
  ClipboardCheck,
  Fuel,
  KeyRound,
  Lock,
  Navigation,
  Phone,
  Plug,
  ScanSearch,
  Speaker,
  SquareArrowDown,
  UserCheck,
  Zap,
} from 'lucide'
import { SERVICES, STAGES, whatsappLink } from './data'

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin)

const root = document.documentElement
const params = new URLSearchParams(location.search)
const capture = params.has('capture')
let has3d = root.classList.contains('has-3d')
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches && !capture
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
const $ = <T extends Element = HTMLElement>(sel: string, el: ParentNode = document) => el.querySelector<T>(sel)!
const $$ = <T extends Element = HTMLElement>(sel: string, el: ParentNode = document) => Array.from(el.querySelectorAll<T>(sel))

const MSG_GENERIC = 'Olá, Ronei! Vim pelo site da RS Automotive e gostaria de falar sobre o meu carro.'

// ---------------------------------------------------------------------------
// Rolagem suave (Lenis) ligada ao ScrollTrigger
// ---------------------------------------------------------------------------

let lenis: Lenis | undefined
if (!reduceMotion && !capture) {
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9, anchors: false })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((t) => lenis!.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
}

function scrollToY(y: number) {
  if (lenis) lenis.scrollTo(y, { duration: 1.4 })
  else window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' })
}

function scrollToEl(el: HTMLElement) {
  const offset = el.id === 'inicio' ? 0 : -70
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.4 })
  else el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
}

let sceneApi: { goToStage: (i: number) => void } | undefined

// Links internos passam pela rolagem suave
document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]')
  if (!a) return
  const id = a.getAttribute('href')!.slice(1)
  if (a.dataset.scrollTo && sceneApi) {
    e.preventDefault()
    sceneApi.goToStage(Number(a.dataset.scrollTo) - 1)
    return
  }
  const target = id ? document.getElementById(id) : null
  if (!target) return
  e.preventDefault()
  scrollToEl(target)
  history.replaceState(null, '', `#${id}`)
})

// ---------------------------------------------------------------------------
// Conteúdo gerado a partir dos dados
// ---------------------------------------------------------------------------

function renderServices() {
  $('[data-services]').innerHTML = SERVICES.map(
    (s, i) => `
    <li class="service-item">
      <article class="service-card" data-spotlight>
        <div class="service-top">
          <span class="service-icon"><i data-lucide="${s.icon}" aria-hidden="true"></i></span>
          <span class="service-n">${String(i + 1).padStart(2, '0')}</span>
        </div>
        <h3>${s.name}</h3>
        <p>${s.description}</p>
        <a class="service-link" data-service-card="${s.id}" target="_blank" rel="noopener"
           href="${whatsappLink(`Olá, Ronei! Vim pelo site e gostaria de um orçamento de ${s.name.toLowerCase()}.`)}"
           aria-label="Pedir orçamento de ${s.name} no WhatsApp">
          <span class="btn-text" data-text="Pedir orçamento">Pedir orçamento</span>
          <span class="service-arrow"><i data-lucide="arrow-up-right" aria-hidden="true"></i></span>
        </a>
      </article>
    </li>`,
  ).join('')
}

function renderChips() {
  $('[data-chips]').innerHTML = SERVICES.map(
    (s) => `
    <label class="chip">
      <input type="checkbox" name="servicos" value="${s.id}" />
      <span><i data-lucide="check" aria-hidden="true"></i>${s.name}</span>
    </label>`,
  ).join('')
}

function renderStoryFallback() {
  $('[data-fallback-list]').innerHTML = STAGES.map(
    (s, i) => `
    <li>
      <img src="./img/etapas/etapa-${i + 1}.webp" alt="Etapa ${i + 1}: ${s.title}" loading="lazy" width="1200" height="750" />
      <div>
        <p class="eyebrow">Etapa ${i + 1} de 8</p>
        <h3>${s.title}</h3>
        <p>${s.text}</p>
        <span class="tag">${s.tag}</span>
      </div>
    </li>`,
  ).join('')
}

/** Teto de luminárias hexagonais (desenhado em SVG). */
function renderHexCeiling() {
  const svg = document.querySelector<SVGElement>('[data-hex]')
  if (!svg) return
  const r = 46
  const w = Math.sqrt(3) * r
  const paths: string[] = []
  for (let row = 0; row < 5; row++) {
    for (let col = -1; col < 1600 / w + 1; col++) {
      const cx = col * w + (row % 2 ? w / 2 : 0)
      const cy = row * r * 1.5 + 10
      const pts = Array.from({ length: 6 }, (_, k) => {
        const a = (Math.PI / 3) * k + Math.PI / 6
        return `${(cx + Math.cos(a) * r * 0.9).toFixed(1)},${(cy + Math.sin(a) * r * 0.9).toFixed(1)}`
      })
      paths.push(`<polygon points="${pts.join(' ')}" style="--d:${(Math.random() * 0.6).toFixed(2)}s" />`)
    }
  }
  svg.innerHTML = `<defs><linearGradient id="hexfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="hexmask"><rect width="1600" height="360" fill="url(#hexfade)"/></mask></defs><g mask="url(#hexmask)">${paths.join('')}</g>`
}

// ---------------------------------------------------------------------------
// WhatsApp: links genéricos e formulário
// ---------------------------------------------------------------------------

function initWhatsappLinks() {
  for (const a of $$<HTMLAnchorElement>('[data-wa]')) a.href = whatsappLink(MSG_GENERIC)
}

function selectService(id: string) {
  const input = $<HTMLInputElement>(`[data-chips] input[value="${id}"]`)
  if (input && !input.checked) {
    input.checked = true
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }
}

function initForm() {
  const form = $<HTMLFormElement>('[data-form]')
  const name = $<HTMLInputElement>('#f-nome')
  const car = $<HTMLInputElement>('#f-carro')
  const msg = $<HTMLTextAreaElement>('#f-msg')
  const preview = $('[data-preview]')
  const nameErr = $('#f-nome-err')
  const servErr = $('#f-serv-err')

  const selected = () =>
    $$<HTMLInputElement>('[data-chips] input:checked').map((i) => SERVICES.find((s) => s.id === i.value)!.name)

  /** Monta a frase; campos vazios saem da mensagem. */
  const buildMessage = () => {
    const n = name.value.trim()
    const c = car.value.trim()
    const servs = selected()
    const d = msg.value.trim().replace(/\s+/g, ' ')
    let text = 'Olá, Ronei!'
    if (n) text += ` Meu nome é ${n}.`
    if (c && servs.length) text += ` Meu carro é um ${c} e preciso de: ${servs.join(', ')}.`
    else if (c) text += ` Meu carro é um ${c}.`
    else if (servs.length) text += ` Preciso de: ${servs.join(', ')}.`
    if (d) text += ` Detalhes: ${/[.!?]$/.test(d) ? d : d + '.'}`
    text += ' Pode me passar um orçamento?'
    return { text, n, servs, d }
  }

  const update = () => {
    const { text, n, servs, d } = buildMessage()
    if (!n && !servs.length && !d && !car.value.trim()) {
      preview.innerHTML = '<span class="ph">Preencha os campos e a mensagem aparece aqui do jeito que vai chegar para o Ronei.</span>'
    } else {
      preview.textContent = text
    }
  }

  const showError = (el: HTMLElement, field: HTMLElement | null, show: boolean) => {
    el.hidden = !show
    field?.setAttribute('aria-invalid', String(show))
    if (show && !reduceMotion) animate(el, { x: [0, -6, 6, -4, 4, 0] }, { duration: 0.4 })
  }

  name.addEventListener('blur', () => showError(nameErr, name, !name.value.trim()))
  name.addEventListener('input', () => name.value.trim() && showError(nameErr, name, false))
  form.addEventListener('input', () => {
    update()
    if (selected().length || msg.value.trim()) showError(servErr, null, false)
  })
  form.addEventListener('change', update)

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const { text, n, servs, d } = buildMessage()
    const nameBad = !n
    const servBad = !servs.length && !d
    showError(nameErr, name, nameBad)
    showError(servErr, null, servBad)
    if (nameBad) return name.focus()
    if (servBad) return $<HTMLInputElement>('[data-chips] input').focus()
    window.open(whatsappLink(text), '_blank', 'noopener')
  })

  // Clicar no card do serviço também deixa o serviço marcado no formulário
  for (const card of $$<HTMLAnchorElement>('[data-service-card]')) {
    card.addEventListener('click', () => selectService(card.dataset.serviceCard!))
  }

  // CTA das etapas: pré-seleciona o serviço e desce até o formulário
  const storyCta = document.querySelector<HTMLAnchorElement>('[data-story-cta]')
  storyCta?.addEventListener('click', (e) => {
    const id = storyCta.dataset.service
    if (id) {
      selectService(id)
    } else {
      e.preventDefault()
      e.stopPropagation()
      window.open(whatsappLink(MSG_GENERIC), '_blank', 'noopener')
    }
  })

  update()
}

// ---------------------------------------------------------------------------
// Header: transparente no topo, sólido ao rolar, some ao descer e volta ao subir
// ---------------------------------------------------------------------------

function initHeader() {
  const header = $('[data-header]')
  const progress = $('[data-header-progress]')
  let lastY = window.scrollY
  const onScroll = () => {
    const y = window.scrollY
    const max = document.documentElement.scrollHeight - window.innerHeight
    header.classList.toggle('is-solid', y > 40)
    const menuOpen = root.classList.contains('menu-open')
    if (!menuOpen && Math.abs(y - lastY) > 6) {
      header.classList.toggle('is-hidden', y > lastY && y > 300)
      lastY = y
    }
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`
  }
  if (lenis) lenis.on('scroll', onScroll)
  else window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  // Destaca o link da seção atual
  const links = $$<HTMLAnchorElement>('.main-nav .nav-link')
  for (const link of links) {
    const target = document.querySelector<HTMLElement>(link.getAttribute('href')!)
    if (!target) continue
    ScrollTrigger.create({
      trigger: target,
      start: 'top 45%',
      end: 'bottom 45%',
      onToggle: (self) => self.isActive && links.forEach((l) => l.classList.toggle('is-active', l === link)),
    })
  }
}

function initMenu() {
  const btn = $<HTMLButtonElement>('[data-menu-toggle]')
  const menu = $('[data-menu]')
  const items = $$('[data-menu-link]', menu)
  let tl: gsap.core.Timeline | undefined

  const setOpen = (open: boolean) => {
    btn.setAttribute('aria-expanded', String(open))
    btn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu')
    root.classList.toggle('menu-open', open)
    tl?.kill()
    if (open) {
      menu.hidden = false
      lenis?.stop()
      $('[data-header]').classList.remove('is-hidden')
      if (reduceMotion) return
      tl = gsap
        .timeline()
        .fromTo(menu, { clipPath: 'circle(0% at 100% 0%)' }, { clipPath: 'circle(150% at 100% 0%)', duration: 0.7, ease: 'power3.inOut' })
        .fromTo(items, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.06, duration: 0.5, ease: 'power3.out' }, 0.3)
    } else {
      lenis?.start()
      if (reduceMotion || menu.hidden) {
        menu.hidden = true
        return
      }
      tl = gsap
        .timeline({ onComplete: () => (menu.hidden = true) })
        .to(menu, { clipPath: 'circle(0% at 100% 0%)', duration: 0.5, ease: 'power3.inOut' })
    }
  }
  btn.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'))
  menu.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) setOpen(false)
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) {
      setOpen(false)
      btn.focus()
    }
  })
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => e.matches && setOpen(false))
}

// ---------------------------------------------------------------------------
// Botões: preenchimento a partir do ponteiro, ímã e clique com mola
// ---------------------------------------------------------------------------

function initButtons() {
  if (reduceMotion) return
  const fillTargets = '.btn, .service-link, .link-arrow, .header-phone'
  document.addEventListener(
    'pointerover',
    (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>(fillTargets)
      if (!b) return
      const r = b.getBoundingClientRect()
      b.style.setProperty('--x', `${e.clientX - r.left}px`)
      b.style.setProperty('--y', `${e.clientY - r.top}px`)
    },
    { passive: true },
  )
  document.addEventListener(
    'pointerout',
    (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>(fillTargets)
      if (!b || b.contains(e.relatedTarget as Node)) return
      const r = b.getBoundingClientRect()
      b.style.setProperty('--x', `${e.clientX - r.left}px`)
      b.style.setProperty('--y', `${e.clientY - r.top}px`)
    },
    { passive: true },
  )

  press('.btn, .service-link, .chip, .menu-btn, [data-story-step]', (el) => {
    animate(el, { scale: 0.95 }, { duration: 0.1 })
    return () => animate(el, { scale: 1 }, { type: 'spring', stiffness: 500, damping: 14 })
  })

  if (!finePointer) return
  // Ímã: o botão segue o cursor com mola
  for (const el of $$('[data-magnetic]')) {
    const inner = el.querySelector<HTMLElement>('.btn-text')
    const icon = el.querySelector<HTMLElement>('.btn-icon')
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      animate(el, { x: dx * 0.22, y: dy * 0.3 }, { type: 'spring', stiffness: 220, damping: 16, mass: 0.6 })
      if (inner) animate(inner, { x: dx * 0.08, y: dy * 0.1 }, { type: 'spring', stiffness: 220, damping: 16 })
      if (icon) animate(icon, { x: dx * 0.14, y: dy * 0.16 }, { type: 'spring', stiffness: 220, damping: 16 })
    })
    el.addEventListener('pointerleave', () => {
      animate(el, { x: 0, y: 0 }, { type: 'spring', stiffness: 260, damping: 12 })
      if (inner) animate(inner, { x: 0, y: 0 }, { type: 'spring', stiffness: 260, damping: 12 })
      if (icon) animate(icon, { x: 0, y: 0 }, { type: 'spring', stiffness: 260, damping: 12 })
    })
  }

  // Cards com holofote seguindo o mouse e leve inclinação
  for (const card of $$('[data-spotlight]')) {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width
      const py = (e.clientY - r.top) / r.height
      card.style.setProperty('--mx', `${px * 100}%`)
      card.style.setProperty('--my', `${py * 100}%`)
      animate(card, { rotateX: (0.5 - py) * 5, rotateY: (px - 0.5) * 6 }, { duration: 0.3 })
    })
    card.addEventListener('pointerleave', () => animate(card, { rotateX: 0, rotateY: 0 }, { type: 'spring', stiffness: 200, damping: 15 }))
  }

  hover('.service-card', (card) => {
    const icon = card.querySelector('.service-icon')!
    animate(icon, { rotate: [0, -12, 8, 0], scale: 1.08 }, { duration: 0.6 })
    return () => animate(icon, { scale: 1 }, { type: 'spring', stiffness: 300, damping: 18 })
  })
}

// ---------------------------------------------------------------------------
// Animações de rolagem (GSAP)
// ---------------------------------------------------------------------------

function initScrollFx() {
  if (reduceMotion) return

  // Títulos entram linha por linha
  document.fonts.ready.then(() => {
    for (const el of $$('[data-split]')) {
      const split = SplitText.create(el, { type: 'lines,words', mask: 'lines', linesClass: 'split-line' })
      gsap.from(split.words, {
        yPercent: 110,
        duration: 0.9,
        ease: 'power4.out',
        stagger: 0.025,
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      })
    }
  })

  // Blocos simples
  gsap.set('[data-reveal]', { autoAlpha: 0, y: 36 })
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1 }),
  })

  // Cards de serviço em cascata
  gsap.set('.service-item', { autoAlpha: 0, y: 50, rotateX: -12 })
  ScrollTrigger.batch('.service-item', {
    start: 'top 90%',
    once: true,
    onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, rotateX: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08 }),
  })

  // Faixa de serviços: corre sozinha e inclina com a velocidade da rolagem
  const ticker = document.querySelector<HTMLElement>('[data-ticker]')
  if (ticker) {
    const loop = gsap.to(ticker, { xPercent: -50, duration: 38, ease: 'none', repeat: -1 })
    const skew = gsap.quickTo(ticker, 'skewX', { duration: 0.4, ease: 'power3' })
    ScrollTrigger.create({
      trigger: ticker,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const v = self.getVelocity()
        skew(gsap.utils.clamp(-12, 12, v / -180))
        loop.timeScale(1 + Math.min(4, Math.abs(v) / 600) * (v < 0 ? -1 : 1))
      },
    })
  }

  // Fita de fotos
  const strip = document.querySelector<HTMLElement>('[data-photo-track]')
  if (strip) {
    gsap.fromTo(
      strip,
      { xPercent: 0 },
      { xPercent: -30, ease: 'none', scrollTrigger: { trigger: strip, start: 'top bottom', end: 'bottom top', scrub: 0.5 } },
    )
  }

  // Galeria com parallax
  for (const fig of $$('[data-speed]')) {
    const speed = Number(fig.dataset.speed)
    gsap.fromTo(
      fig,
      { y: (1 - speed) * -260 },
      { y: (1 - speed) * 260, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } },
    )
    const img = fig.querySelector('img')
    if (img) gsap.fromTo(img, { scale: 1.18 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'center center', scrub: true } })
  }

  // Linha dos passos desenhada pela rolagem
  const steps = document.querySelector('[data-steps]')
  if (steps) {
    gsap.fromTo('[data-steps-line]', { drawSVG: '0%' }, { drawSVG: '100%', ease: 'none', scrollTrigger: { trigger: steps, start: 'top 70%', end: 'bottom 60%', scrub: true } })
    for (const li of $$('[data-step]', steps)) {
      ScrollTrigger.create({ trigger: li, start: 'top 65%', onEnter: () => li.classList.add('is-on'), onLeaveBack: () => li.classList.remove('is-on') })
    }
  }

  // Faixa zebrada da chamada se mexe com a rolagem
  for (const [i, h] of $$('.hazard').entries()) {
    gsap.fromTo(h, { backgroundPositionX: 0 }, { backgroundPositionX: i ? -400 : 400, ease: 'none', scrollTrigger: { trigger: '.cta-band', start: 'top bottom', end: 'bottom top', scrub: true } })
  }

  // Texto gigante do rodapé
  gsap.from('.footer-giant', { yPercent: 40, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } })
}

// ---------------------------------------------------------------------------
// Hero: ignição, título, scanner
// ---------------------------------------------------------------------------

function heroReveal() {
  const title = document.querySelector<HTMLElement>('[data-split-hero]')
  const tl = gsap.timeline()
  if (title) {
    const split = SplitText.create(title, { type: 'lines,words,chars', mask: 'lines' })
    tl.from(split.chars, { yPercent: 120, rotate: 6, duration: 1, ease: 'power4.out', stagger: 0.012 }, 0)
  }
  tl.from('[data-hero-in]', { autoAlpha: 0, y: 28, duration: 0.9, ease: 'power3.out', stagger: 0.08 }, 0.25)
  tl.from('[data-hud]', { autoAlpha: 0, x: 40, duration: 0.9, ease: 'power3.out' }, 0.45)
  tl.from('.site-header .header-inner > *', { autoAlpha: 0, y: -20, duration: 0.7, ease: 'power3.out', stagger: 0.08 }, 0.1)
  tl.from('[data-scroll-cue]', { autoAlpha: 0, duration: 0.6 }, 1)
  return tl
}

function initHud() {
  const counts = $$('[data-count]')
  const run = () => {
    for (const el of counts) {
      const to = Number(el.dataset.count)
      const obj = { v: 0 }
      gsap.to(obj, {
        v: to,
        duration: 1.6,
        ease: 'power2.out',
        delay: 0.6,
        onUpdate: () => (el.textContent = obj.v.toFixed(1).replace('.', ',')),
      })
    }
  }
  if (reduceMotion) counts.forEach((el) => (el.textContent = Number(el.dataset.count).toFixed(1).replace('.', ',')))
  else run()

  // Onda de osciloscópio (para quando o hero sai da tela)
  const wave = document.querySelector<SVGPathElement>('[data-wave]')
  if (!wave) return
  const draw = (t: number) => {
    let d = 'M0 24'
    for (let x = 0; x <= 240; x += 4) {
      const y = 24 + Math.sin(x * 0.08 + t * 4) * 9 * Math.sin(x * 0.013 + t) + (x % 60 < 4 ? -14 : 0)
      d += ` L${x} ${y.toFixed(1)}`
    }
    wave.setAttribute('d', d)
  }
  draw(0)
  if (reduceMotion) return
  let on = false
  const tick = () => draw(performance.now() / 1000)
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !on) gsap.ticker.add(tick)
    else if (!e.isIntersecting && on) gsap.ticker.remove(tick)
    on = e.isIntersecting
  }).observe(wave)
}

function initIntro(onLights: (v: number) => void) {
  const intro = document.querySelector<HTMLElement>('[data-intro]')
  if (!intro || !root.classList.contains('is-loading')) {
    intro?.remove()
    onLights(1)
    if (!reduceMotion && !capture) heroReveal()
    return
  }
  const volts = $('[data-intro-volts]')
  const bar = $('[data-intro-bar]')
  const obj = { v: 0 }
  const tl = gsap.timeline({
    onComplete: () => {
      intro.remove()
    },
  })
  tl.to(obj, { v: 12.6, duration: 1.1, ease: 'power2.out', onUpdate: () => (volts.textContent = obj.v.toFixed(1).replace('.', ',')) })
  tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: 'power2.out' }, 0)
  tl.add(() => root.classList.add('lights-on'), 0.9)
  tl.to(intro, { clipPath: 'inset(0 0 100% 0)', duration: 0.8, ease: 'power4.inOut' }, 1.25)
  tl.add(() => root.classList.remove('is-loading'), 1.3)
  // Faróis piscam duas vezes, devagar, e ficam acesos
  const L = { v: 0 }
  tl.to(L, { v: 1, duration: 0.18, onUpdate: () => onLights(L.v) }, 1.55)
  tl.to(L, { v: 0.15, duration: 0.18, onUpdate: () => onLights(L.v) }, 1.8)
  tl.to(L, { v: 1, duration: 0.3, onUpdate: () => onLights(L.v) }, 2.05)
  tl.add(heroReveal(), 1.45)
}

// ---------------------------------------------------------------------------
// Cena 3D (carregada sob demanda)
// ---------------------------------------------------------------------------

let pendingLights = 0
let setLights: (v: number) => void = (v) => (pendingLights = v)

async function init3d() {
  const { initScene } = await import('./scene')
  const api = initScene($('[data-scene]'), scrollToY)
  sceneApi = api
  api.viewer.state.lights = pendingLights
  setLights = (v) => {
    api.viewer.state.lights = v
  }
  ScrollTrigger.refresh()
}

// ---------------------------------------------------------------------------

function icons() {
  createIcons({
    icons: {
      ArrowDown,
      ArrowUpRight,
      BatteryCharging,
      BellRing,
      Check,
      ClipboardCheck,
      Fuel,
      KeyRound,
      Lock,
      Navigation,
      Phone,
      Plug,
      ScanSearch,
      Speaker,
      SquareArrowDown,
      UserCheck,
      Zap,
    },
  })
}

function initWaFloat() {
  if (reduceMotion) return
  animate('.wa-float-ring', { scale: [1, 1.6], opacity: [0.6, 0] }, { duration: 2.2, repeat: Infinity, ease: 'easeOut' })
  gsap.from('[data-wa-float]', { scale: 0, rotate: -90, duration: 0.8, ease: 'back.out(2)', delay: 2.4 })
}

renderServices()
renderChips()
renderHexCeiling()
if (!has3d) renderStoryFallback()
icons()
initWhatsappLinks()
initForm()
initHeader()
initMenu()
initButtons()
initHud()
initWaFloat()
$('[data-year]').textContent = String(new Date().getFullYear())

if (has3d) {
  init3d()
    .then(() => {
      initScrollFx()
      ScrollTrigger.refresh()
    })
    .catch((err) => {
      // Se algo falhar ao montar a cena, volta para a versão estática
      console.error(err)
      has3d = false
      root.classList.remove('has-3d')
      renderStoryFallback()
      initScrollFx()
    })
} else {
  initScrollFx()
}
initIntro((v) => setLights(v))
