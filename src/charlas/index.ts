import { bienvenidos } from './bienvenidos'
import { workshop } from './workshop'
import { build } from './build'
import type { Charla, Slide } from '../deck/slide'

// Bienvenidos y BNB Agent Studio van en un solo deck, el que abre la raíz del sitio (PRINCIPAL en deck/state.ts).
// Una historia en cinco actos; la slide de QR de Bienvenidos cierra la noche.
const acto = (nombre: string, ss: Slide[]) => ss.map((s) => ({ ...s, acto: nombre }))
const [portada, quienes, sesiones, hoy, mesas] = bienvenidos.slides
const cobrar = workshop.slides.findIndex((s) => s.titulo === 'Quién es')
const studio = workshop.slides.findIndex((s) => s.titulo === 'BNB Agent Studio')
const ustedes = workshop.slides.findIndex((s) => s.titulo === 'Proyecto 1 · Turnos con seña')
const noche: Charla = {
  ...bienvenidos,
  titulo: 'BNB Builder Session',
  minutos: bienvenidos.minutos + workshop.minutos,
  slides: [
    ...acto('La noche', [portada, quienes, sesiones, hoy]),
    ...acto('El agente', workshop.slides.slice(0, cobrar)),
    ...acto('Cobrar', workshop.slides.slice(cobrar, studio)),
    ...acto('Studio', workshop.slides.slice(studio, ustedes)),
    ...acto('Ahora ustedes', [...workshop.slides.slice(ustedes), mesas]),
  ],
}
// build sigue andando por URL (?charla=build), sin menú que lo liste.
export const CHARLAS = [noche, build]
