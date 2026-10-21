import { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { FondoCtx, gsap, REVEAL, reducedMotion } from '../motion/motion'
import { SlideCtx, Stage, type Charla } from './slide'
import type { Accion, Pos } from './state'

const TECLAS: Record<string, Accion> = { ArrowRight: 'next', ' ': 'next', PageDown: 'next', ArrowLeft: 'prev', PageUp: 'prev', Home: 'first', End: 'last' }

type Props = { charla: Charla; pos: Pos; onMover: (a: Accion) => void; onSalir: () => void; onPresentador: () => void }

export function Deck({ charla, pos, onMover, onSalir, onPresentador }: Props) {
  const scope = useRef<HTMLDivElement>(null)
  const [montada, setMontada] = useState(pos.slide) // la slide en pantalla; va un instante detrás de pos mientras sale la anterior
  const paso = useRef(pos.step)
  if (montada === pos.slide) paso.current = pos.step
  const fondo = useContext(FondoCtx)

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const accion = TECLAS[e.key]
      if (accion) { e.preventDefault(); onMover(accion) }
      else if (e.key === 'Escape') onSalir()
      else if (e.repeat) return
      else if (e.key.toLowerCase() === 'f') document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.()
      else if (e.key.toLowerCase() === 'p') onPresentador()
    }
    addEventListener('keydown', tecla)
    return () => removeEventListener('keydown', tecla)
  }, [onMover, onSalir, onPresentador])

  // La cuadrícula del fondo corre un paso por slide.
  useEffect(() => {
    const o = { avance: pos.slide - 1 }
    const tw = gsap.to(o, { avance: pos.slide, duration: reducedMotion() ? 0 : 0.9, ease: 'expo.out', onUpdate: () => fondo.set({ avance: o.avance }) })
    return () => { tw.kill() }
  }, [pos.slide, fondo])

  // Salida: el título se va por su máscara y el resto sube rápido; recién ahí se monta la nueva.
  useEffect(() => {
    if (pos.slide === montada) return
    if (reducedMotion()) { setMontada(pos.slide); return }
    const root = scope.current!
    const letras = root.querySelectorAll('.slide .word, .slide .char')
    const tl = gsap.timeline({ onComplete: () => setMontada(pos.slide) })
    if (letras.length) tl.to(letras, { yPercent: -110, duration: 0.3, ease: 'power2.in', stagger: 0.015 }, 0)
    tl.to(root.querySelector('.slide'), { y: -50, autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, 0.12)
    return () => { tl.kill() }
  }, [pos.slide, montada])

  // Entrada: el título se revela palabra por palabra (M-REV-01), el resto sube detrás, y después la coreografía propia de la slide.
  useLayoutEffect(() => {
    if (reducedMotion()) return
    const ctx = gsap.context(() => {
      const root = scope.current!.querySelector<HTMLElement>('.slide')!
      const tl = gsap.timeline()
      tl.from('.slide .word', { yPercent: 110, duration: REVEAL.duration, ease: REVEAL.ease, stagger: REVEAL.stagger }, 0)
      if (root.querySelector('.char')) tl.from('.slide .char', { yPercent: 110, autoAlpha: 0, duration: REVEAL.duration, ease: REVEAL.ease, stagger: 0.02 }, 0)
      tl.from('.slide [data-in]', { y: 40, autoAlpha: 0, duration: REVEAL.duration, ease: REVEAL.ease, stagger: 0.06 }, 0.1)
      charla.slides[montada].coreografia?.(root, tl)
    }, scope)
    return () => ctx.revert()
  }, [montada, charla])

  const slide = charla.slides[montada]
  const total = charla.slides.length
  return (
    <div
      ref={scope}
      className="deck"
      onClick={(e) => { if (!(e.target as HTMLElement).closest('a, button')) onMover('next') }}
    >
      <Stage>
        <SlideCtx.Provider value={{ step: paso.current, animar: true }}>
          <div className="slide" key={montada} data-step={paso.current}>{slide.contenido()}</div>
        </SlideCtx.Provider>
        <div className="hud">
          <button type="button" className="hud-menu" onClick={onSalir}>← Charlas</button>
          <span>{charla.titulo} · <b>{pos.slide + 1}</b> / {total}</span>
        </div>
        <div className="avance" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={pos.slide + 1} aria-label="Avance de la charla">
          <i style={{ transform: `scaleX(${(pos.slide + 1) / total})` }} />
        </div>
      </Stage>
    </div>
  )
}
