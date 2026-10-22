import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { gsap, REVEAL, reducedMotion } from '../motion/motion'

// Una slide es un objeto: sumar una slide es sumar uno de estos al array de su charla.
export type Slide = {
  titulo: string // para el presentador y el contador
  acto?: string // parte de la historia; se ve abajo a la izquierda (ver charlas/index.ts)
  pasos?: number // cuántas partes se revelan de a una con →
  notas?: string // guion, se ve solo en el modo presentador
  contenido: () => ReactNode // lo que va en el lienzo de 1920×1080
  // Coreografía propia de entrada: agrega a la timeline que ya trae el título (0 a 0.8 s) y los [data-in].
  coreografia?: (root: HTMLElement, tl: gsap.core.Timeline) => void
}
export type Charla = { slug: string; titulo: string; bajada: string; minutos: number; slides: Slide[] }

// Paso actual de la slide montada. `animar` es false en las miniaturas del presentador.
export const SlideCtx = createContext({ step: 0, animar: false })

export type Desde = 'abajo' | 'arriba' | 'izq' | 'der' | 'escala' | 'clip'
const ENTRADAS: Record<Desde, [gsap.TweenVars, gsap.TweenVars]> = {
  abajo: [{ autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0 }],
  arriba: [{ autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0 }],
  izq: [{ autoAlpha: 0, x: -80 }, { autoAlpha: 1, x: 0 }],
  der: [{ autoAlpha: 0, x: 80 }, { autoAlpha: 1, x: 0 }],
  escala: [{ autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1 }],
  clip: [{ autoAlpha: 1, clipPath: 'inset(0 100% 0 0)' }, { autoAlpha: 1, clipPath: 'inset(0 0% 0 0)' }],
}

// Envuelve lo que aparece recién en el paso n. Al avanzar entra con el reveal; al volver se oculta sin animación.
// `desde` elige la entrada. Si adentro hay hijos con `data-s`, entran ellos de a uno (stagger 0.25) en vez del envoltorio,
// cada uno con su `data-origen` (transform-origin). `tipea` muestra los `.char` de adentro como si se escribieran,
// y `[data-regla]` (las reglas amarillas) crecen desde la izquierda después de entrar.
export function Paso({ n, children, className, desde = 'abajo', tipea }: { n: number; children: ReactNode; className?: string; desde?: Desde; tipea?: boolean }) {
  const { step, animar } = useContext(SlideCtx)
  const ref = useRef<HTMLDivElement>(null)
  const antes = useRef<boolean | null>(null)
  useLayoutEffect(() => {
    const el = ref.current!
    const visible = step >= n
    const hijos = el.querySelectorAll<HTMLElement>('[data-s]')
    const reglas = el.querySelectorAll<HTMLElement>('[data-regla]')
    const chars = tipea ? el.querySelectorAll<HTMLElement>('.char') : []
    const [de, a] = ENTRADAS[desde]
    if (visible && antes.current === false && animar && !reducedMotion()) {
      const tl = gsap.timeline()
      if (hijos.length) {
        gsap.set(el, { autoAlpha: 1, x: 0, y: 0, scale: 1, clipPath: 'none' })
        hijos.forEach((h) => { h.style.transformOrigin = h.dataset.origen ?? 'center' })
        tl.fromTo(hijos, de, { ...a, duration: 0.55, ease: REVEAL.ease, stagger: 0.25 })
      } else tl.fromTo(el, de, { ...a, duration: REVEAL.duration, ease: REVEAL.ease })
      if (reglas.length) tl.fromTo(reglas, { scaleX: 0, transformOrigin: 'left' }, { scaleX: 1, duration: 0.8, ease: REVEAL.ease, stagger: 0.12 }, 0.15)
      if (chars.length) tl.from(chars, { autoAlpha: 0, duration: 0.01, stagger: 0.03 }, 0.2)
      antes.current = visible
      return () => { tl.kill() }
    }
    gsap.set([el, ...hijos], { autoAlpha: visible ? 1 : 0, x: 0, y: 0, scale: 1, clipPath: 'none' })
    if (reglas.length) gsap.set(reglas, { scaleX: 1 })
    if (chars.length) gsap.set(chars, { autoAlpha: 1 })
    antes.current = visible
  }, [step, n, animar, desde, tipea])
  return <div ref={ref} className={className}>{children}</div>
}

// Lienzo fijo de 1920×1080 que se escala al espacio disponible: el diseño es idéntico en cualquier proyector.
export function Stage({ children }: { children: ReactNode }) {
  const caja = useRef<HTMLDivElement>(null)
  const [escala, setEscala] = useState(0)
  useLayoutEffect(() => {
    const el = caja.current!
    const medir = () => setEscala(Math.min(el.clientWidth / 1920, el.clientHeight / 1080))
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    medir()
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={caja} className="stage-box">
      <div className="stage" style={{ transform: `translate(-50%, -50%) scale(${escala})` }}>{children}</div>
    </div>
  )
}
