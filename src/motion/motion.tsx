// Piezas tomadas de @crisol/motion-kit (repo Crisol, packages/motion-kit/src: gsap.ts y split.tsx).
// El kit es un paquete privado de ese monorepo, por eso se copian acá solo las que no dependen de scroll.
// Los valores son los medidos en itsoffbrand.com (Crisol/docs/landing/research/offbrand/analysis.md §5).
import { createContext, Fragment } from 'react'
import gsap from 'gsap'
import type { FondoParams } from '../fondo'

export { gsap }
export const EASE_ROLL = 'cubic-bezier(0.165, 0.84, 0.44, 1)' // M-HOV-01
export const REVEAL = { duration: 0.8, ease: 'expo.out', stagger: 0.04 } // M-REV-01/02

// `?quieto` en la URL fuerza el modo sin animación: sirve para revisar cada slide en su estado final (capturas).
const QUIETO = new URLSearchParams(location.search).has('quieto')
export const reducedMotion = () => QUIETO || matchMedia('(prefers-reduced-motion: reduce)').matches

// El fondo (src/fondo.ts) lo arranca App y cualquier vista le mueve los parámetros por acá.
export const FondoCtx = createContext<{ set: (p: Partial<FondoParams>) => void }>({ set: () => {} })

// M-REV-02: cada palabra en su máscara (.words-clip) para entrar desde abajo.
// Deja una copia sr-only del texto para lectores de pantalla.
export function WordsIn({ text }: { text: string }) {
  return (
    <span className="words-in">
      {text.split(' ').map((w, i) => (
        <Fragment key={i}>
          <span className="words-clip" aria-hidden><span className="word">{w}</span></span>{' '}
        </Fragment>
      ))}
      <span className="sr-only">{text}</span>
    </span>
  )
}

// Chars: el espacio va como nbsp; un ' ' dentro de un inline-block colapsa y pega las palabras.
// El deck anima `.char` al entrar (sube por char); `tipear` los muestra de a uno como si se escribieran.
export function Chars({ text }: { text: string }) {
  return (
    <span className="chars" aria-label={text}>
      {[...text].map((c, i) => <span key={i} className="char" aria-hidden>{c === ' ' ? ' ' : c}</span>)}
    </span>
  )
}

// Recetas para las coreografías de slide. Todas agregan a la timeline que les pasa el deck.
/** Muestra los `.char` de `sel` de a uno, a `cada` segundos (0.012 ≈ 80 chars por segundo). */
export const tipear = (tl: gsap.core.Timeline, sel: gsap.TweenTarget, cada = 0.012, at: gsap.Position = '>') =>
  tl.from(sel, { autoAlpha: 0, duration: 0.01, stagger: cada }, at)
/** Dibuja un trazo SVG que tenga `pathLength="1"`. */
export const dibujar = (tl: gsap.core.Timeline, sel: gsap.TweenTarget, duration = 0.8, at: gsap.Position = '>') =>
  tl.fromTo(sel, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration, ease: 'power2.inOut' }, at)
/** Sacudida corta en x: marca un intento, algo que no corresponde. */
export const sacudir = (tl: gsap.core.Timeline, sel: gsap.TweenTarget, at: gsap.Position = '>') =>
  tl.fromTo(sel, { x: -7 }, { x: 7, duration: 0.07, repeat: 5, yoyo: true, ease: 'none' }, at).set(sel, { x: 0 })
