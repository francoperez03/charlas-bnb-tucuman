import { type Charla } from '../deck/slide'
import { vacias } from './vacias'

// Fuente: agenda.md, bloque de las 19:00. Reemplazar `vacias` por las slides reales.
export const build: Charla = {
  slug: 'build',
  titulo: 'Build session',
  bajada: 'Creá un agente que compra, vende y cobra',
  minutos: 120,
  slides: vacias('Build session', 'build.tsx'),
}
