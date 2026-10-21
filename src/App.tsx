import { useCallback, useEffect, useRef, useState } from 'react'
import { FondoCtx, gsap, reducedMotion } from './motion/motion'
import type { Fondo } from './fondo'
import { CHARLAS } from './charlas'
import { Deck } from './deck/Deck'
import { Presenter } from './deck/Presenter'
import { Menu } from './Menu'
import { acotar, escribirURL, leerURL, mover, type Accion, type Ruta } from './deck/state'

const buscar = (slug: string | null) => CHARLAS.find((c) => c.slug === slug) ?? null
const pasosDe = (slug: string | null) => (buscar(slug)?.slides ?? []).map((s) => s.pasos ?? 0)

// Lee la URL y la deja coherente: charla que no existe = menú, slide o paso fuera de rango = el más cercano.
function rutaInicial(): Ruta {
  const r = leerURL(location.search)
  const charla = buscar(r.charla)?.slug ?? null
  return { ...r, charla, pos: charla ? acotar(r.pos, pasosDe(charla)) : { slide: 0, step: 0 } }
}

export default function App() {
  const [ruta, setRuta] = useState(rutaInicial)
  const [vista, setVista] = useState(ruta.charla) // lo que está en pantalla; cambia en el medio de la cortina
  const actual = useRef(ruta)
  actual.current = ruta
  const canal = useRef<BroadcastChannel | null>(null)
  const cortina = useRef<HTMLDivElement>(null)
  const lienzo = useRef<HTMLCanvasElement>(null)
  const fondo = useRef<Fondo | null>(null)
  const [fondoCtx] = useState(() => ({ set: (p: Parameters<Fondo['set']>[0]) => fondo.current?.set(p) }))
  const ultima = useRef(ruta.pos)

  // Fondo animado con vgpu, uno solo para el menú y las charlas, solo si el navegador tiene WebGPU. Se carga aparte.
  useEffect(() => {
    if (!('gpu' in navigator)) return
    let vivo = true
    import('./fondo').then((m) => { if (vivo && lienzo.current) fondo.current = m.iniciarFondo(lienzo.current, reducedMotion()) }).catch(() => {})
    return () => { vivo = false; fondo.current?.parar(); fondo.current = null }
  }, [])

  // Si la URL llegó con una charla que no existe o una slide fuera de rango, se corrige en la barra de direcciones.
  useEffect(() => { history.replaceState(null, '', escribirURL(actual.current)) }, [])

  // Cambia de lugar. Entrar o salir de una charla suma una entrada al historial; moverse entre slides no.
  const ir = useCallback((r: Ruta, remoto = false) => {
    const cambiaCharla = r.charla !== actual.current.charla
    history[cambiaCharla && !remoto ? 'pushState' : 'replaceState'](null, '', escribirURL(r))
    setRuta(r)
    if (!remoto) canal.current?.postMessage({ charla: r.charla, pos: r.pos })
  }, [])

  // El proyector y el presentador se siguen entre sí por un canal del navegador, sin servidor.
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const c = new BroadcastChannel('charlas-bnb')
    canal.current = c
    c.onmessage = (e) => {
      if (e.data === 'hola') { c.postMessage({ charla: actual.current.charla, pos: actual.current.pos }); return }
      ir({ ...actual.current, charla: e.data.charla, pos: e.data.pos }, true)
    }
    if (actual.current.presenter) c.postMessage('hola') // el presentador recién abierto pide dónde está el proyector
    const atras = () => setRuta(rutaInicial())
    addEventListener('popstate', atras)
    return () => { c.close(); removeEventListener('popstate', atras) }
  }, [ir])

  // Cortina amarilla entre el menú y una charla: sube tapando, cambia la vista, y se va con el borde en diagonal.
  useEffect(() => {
    if (ruta.charla === vista) return
    const el = cortina.current
    if (!el || ruta.presenter || reducedMotion()) { setVista(ruta.charla); return }
    const tl = gsap.timeline()
      .set(el, { autoAlpha: 1 })
      .fromTo(el, { yPercent: 100, clipPath: 'polygon(0 18%, 100% 0, 100% 100%, 0 100%)' }, { yPercent: 0, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', duration: 0.5, ease: 'expo.in' })
      .call(() => setVista(actual.current.charla))
      .to(el, { yPercent: -110, clipPath: 'polygon(0 0, 100% 0, 100% 82%, 0 100%)', duration: 0.9, ease: 'expo.inOut' }, '+=0.05')
      .set(el, { autoAlpha: 0 })
    return () => { tl.kill(); gsap.set(el, { autoAlpha: 0 }) }
  }, [ruta.charla, ruta.presenter, vista])

  // → en la última slide de una charla vuelve al menú (en el proyector; el presentador se queda).
  const onMover = useCallback((a: Accion) => {
    const r = actual.current
    const pos = mover(r.pos, a, pasosDe(r.charla))
    const alFinal = a === 'next' && pos.slide === r.pos.slide && pos.step === r.pos.step
    ir(alFinal && !r.presenter ? { ...r, charla: null, pos: { slide: 0, step: 0 } } : { ...r, pos })
  }, [ir])
  const onSalir = useCallback(() => ir({ ...actual.current, charla: null, pos: { slide: 0, step: 0 } }), [ir])
  const onElegir = useCallback((slug: string) => ir({ ...actual.current, charla: slug, pos: { slide: 0, step: 0 } }), [ir])
  const onPresentador = useCallback(() => {
    window.open(escribirURL({ ...actual.current, presenter: true }), 'presentador', 'popup,width=1280,height=800')
  }, [])

  if (ruta.presenter) return <Presenter charla={buscar(ruta.charla)} pos={ruta.pos} onMover={onMover} />

  const charla = buscar(vista)
  // Mientras corre la cortina hacia el menú, la charla sigue montada en la última slide que mostró.
  if (vista === ruta.charla) ultima.current = ruta.pos
  const pos = ultima.current
  return (
    <FondoCtx.Provider value={fondoCtx}>
      <canvas ref={lienzo} className="fondo" aria-hidden />
      {charla
        ? <Deck key={charla.slug} charla={charla} pos={pos} onMover={onMover} onSalir={onSalir} onPresentador={onPresentador} />
        : <Menu onElegir={onElegir} />}
      <div ref={cortina} className="cortina" aria-hidden />
    </FondoCtx.Provider>
  )
}
