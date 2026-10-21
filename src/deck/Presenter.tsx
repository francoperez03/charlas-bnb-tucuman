import { useEffect, useState } from 'react'
import { SlideCtx, Stage, type Charla } from './slide'
import { mover, type Accion, type Pos } from './state'

const reloj = (ms: number) => {
  const s = Math.floor(ms / 1000)
  return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((n) => String(n).padStart(2, '0')).join(':')
}

// Vista para la notebook de quien habla: slide actual, la que sigue, cronómetro y guion.
// Se abre con la tecla p desde el deck y se mueve junto con la ventana del proyector.
export function Presenter({ charla, pos, onMover }: { charla: Charla | null; pos: Pos; onMover: (a: Accion) => void }) {
  const [crono, setCrono] = useState({ desde: null as number | null, acumulado: 0 })
  const [, tic] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tic((n) => n + 1), 500)
    return () => clearInterval(id)
  }, [])
  useEffect(() => {
    if (!charla) return
    const tecla = (e: KeyboardEvent) => {
      const a = ({ ArrowRight: 'next', ' ': 'next', PageDown: 'next', ArrowLeft: 'prev', PageUp: 'prev' } as Record<string, Accion>)[e.key]
      if (a) { e.preventDefault(); onMover(a) }
    }
    addEventListener('keydown', tecla)
    return () => removeEventListener('keydown', tecla)
  }, [charla, onMover])

  if (!charla) return <main className="pres pres-vacio"><p>Elegí una charla en la ventana del proyector y esta vista la sigue.</p></main>

  const pasos = charla.slides.map((s) => s.pasos ?? 0)
  const sig = mover(pos, 'next', pasos)
  const hayMas = sig.slide !== pos.slide || sig.step !== pos.step
  const actual = charla.slides[pos.slide]
  const corriendo = crono.desde !== null
  const tiempo = crono.acumulado + (corriendo ? Date.now() - crono.desde! : 0)
  const mini = (p: Pos) => (
    <Stage>
      <SlideCtx.Provider value={{ step: p.step, animar: false }}>
        <div className="slide" key={`${p.slide}-${p.step}`}>{charla.slides[p.slide].contenido()}</div>
      </SlideCtx.Provider>
    </Stage>
  )
  return (
    <main className="pres">
      <section className="pres-actual">
        <header>
          <span>{charla.titulo}</span>
          <span>{pos.slide + 1} / {charla.slides.length}{pasos[pos.slide] ? ` · paso ${pos.step} de ${pasos[pos.slide]}` : ''}</span>
        </header>
        <div className="pres-lienzo">{mini(pos)}</div>
        <p className="pres-titulo">{actual.titulo}</p>
      </section>
      <section className="pres-notas">
        <h2>Guion</h2>
        <p>{actual.notas ?? 'Esta slide no tiene guion cargado.'}</p>
      </section>
      <section className="pres-sigue">
        <h2>{hayMas ? (sig.slide === pos.slide ? `Sigue · paso ${sig.step}` : 'Sigue') : 'Fin de la charla'}</h2>
        {hayMas && <div className="pres-lienzo">{mini(sig)}</div>}
      </section>
      <section className="pres-crono">
        <h2>Tiempo · charla de {charla.minutos} min</h2>
        <p className="pres-reloj">{reloj(tiempo)}</p>
        <div className="pres-botones">
          <button type="button" onClick={() => setCrono(corriendo ? { desde: null, acumulado: tiempo } : { desde: Date.now(), acumulado: crono.acumulado })}>{corriendo ? 'Pausar' : 'Iniciar'}</button>
          <button type="button" onClick={() => setCrono({ desde: null, acumulado: 0 })}>Reiniciar</button>
          <button type="button" onClick={() => onMover('prev')} aria-label="Anterior">←</button>
          <button type="button" onClick={() => onMover('next')} aria-label="Siguiente">→</button>
        </div>
      </section>
    </main>
  )
}
