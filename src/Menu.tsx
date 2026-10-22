import { pub } from './pub'
import { useLayoutEffect, useRef } from 'react'
import { gsap, REVEAL, reducedMotion } from './motion/motion'
import { CHARLAS } from './charlas'
import { escribirURL } from './deck/state'

// Sitio publicado (respaldo en GitHub Pages, ver scripts/pages.sh). Los logos vienen de la placa (assets/placa-utn/logos).
const SITIO = 'https://charlas-bnb-tucuman.vercel.app/'
const SPONSORS: [string, string][] = [
  ['pcn-oscuro.png', 'PCN · Programa Con Nosotros'],
  ['sistemas-1-oscuro.png', 'Ingeniería en Sistemas · UTN FRT'],
  ['sistemas-2-oscuro.png', 'Departamento de Sistemas · UTN FRT'],
  ['undercode-oscuro.png', 'Undercode'],
]

export function Menu({ onElegir }: { onElegir: (slug: string) => void }) {
  const scope = useRef<HTMLElement>(null)
  // Entrada: cada título sube desde su máscara, uno detrás del otro (M-REV-01), y el resto aparece detrás.
  useLayoutEffect(() => {
    if (reducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.from('.item-titulo > span', { yPercent: 115, duration: REVEAL.duration + 0.2, ease: REVEAL.ease, stagger: 0.09 })
      gsap.from('[data-in]', { y: 24, autoAlpha: 0, duration: REVEAL.duration, ease: REVEAL.ease, stagger: 0.05, delay: 0.25 })
      gsap.from('.menu-qr', { scale: 0.85, autoAlpha: 0, duration: 1.2, ease: REVEAL.ease, delay: 0.3 })
    }, scope)
    return () => ctx.revert()
  }, [])
  return (
    <main ref={scope} className="menu">
      <header className="menu-top" data-in>
        <img src={pub("/bnb-chain-logo-vertical.png")} alt="BNB Chain" />
        <p>BNB Builder Session Tucumán · jue 22 oct</p>
      </header>
      <nav aria-label="Charlas">
        <ol className="lista">
          {CHARLAS.map((c, i) => (
            <li key={c.slug}>
              <a
                className="item"
                href={escribirURL({ charla: c.slug, pos: { slide: 0, step: 0 }, presenter: false })}
                onClick={(e) => { e.preventDefault(); onElegir(c.slug) }}
              >
                <span className="item-n" data-in>{String(i + 1).padStart(2, '0')}</span>
                <span className="item-titulo"><span>{c.titulo}</span></span>
                <span className="item-bajada" data-in>{c.bajada}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <footer className="menu-pie" data-in>
        <p className="firma">Con 💛 por <img src={pub("/logo-crisol-mono.svg")} alt="Crisol" /></p>
        <ul className="menu-sponsors" aria-label="Con el apoyo de">
          {SPONSORS.map(([f, n]) => <li key={f}><img src={pub(`/sponsors/${f}`)} alt={n} /></li>)}
        </ul>
      </footer>
      {/* QR al sitio de las charlas, para seguir las slides desde el teléfono (URL en scripts/pages.sh). */}
      <a className="menu-qr" href={SITIO} target="_blank" rel="noreferrer">
        <img src={pub('/qr-charlas.svg')} alt="QR al sitio de las charlas" />
        <span><b>Seguí las slides</b>{SITIO.replace('https://', '')}</span>
      </a>
    </main>
  )
}
