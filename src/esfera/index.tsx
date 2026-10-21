import { Suspense, lazy } from 'react'
import type { EsferaProps } from './Esfera'

// three y R3F van en su propio chunk: el menú arranca sin esperarlos y la esfera aparece cuando carga.
const Lazy = lazy(() => import('./Esfera'))
// Nombres de las capas, de adentro hacia afuera. Viven acá para no arrastrar three al chunk principal.
export const CAPAS = ['LLM', 'Prompt', 'Herramientas', 'Memoria', 'Guardrails']
export function Esfera(props: EsferaProps) {
  return <Suspense fallback={null}><Lazy {...props} /></Suspense>
}
