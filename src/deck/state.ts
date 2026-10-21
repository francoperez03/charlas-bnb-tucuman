// Posición dentro de una charla y su ida y vuelta con la URL.
// ?charla=solana&slide=3&step=1 abre esa slide en ese paso; &presenter=1 abre el modo presentador.

export type Pos = { slide: number; step: number } // slide desde 0
export type Ruta = { charla: string | null; pos: Pos; presenter: boolean }
export type Accion = 'next' | 'prev' | 'first' | 'last'

// pasos[i] = cuántos pasos tiene la slide i (0 = ninguno).
export function mover(pos: Pos, accion: Accion, pasos: number[]): Pos {
  const ultima = pasos.length - 1
  if (accion === 'first') return { slide: 0, step: 0 }
  if (accion === 'last') return { slide: ultima, step: pasos[ultima] }
  if (accion === 'next') {
    if (pos.step < pasos[pos.slide]) return { slide: pos.slide, step: pos.step + 1 }
    return pos.slide < ultima ? { slide: pos.slide + 1, step: 0 } : pos
  }
  if (pos.step > 0) return { slide: pos.slide, step: pos.step - 1 }
  return pos.slide > 0 ? { slide: pos.slide - 1, step: pasos[pos.slide - 1] } : pos
}

// Mete una posición cualquiera (por ejemplo, una URL escrita a mano) dentro de los límites de la charla.
export function acotar(pos: Pos, pasos: number[]): Pos {
  const slide = Math.min(Math.max(pos.slide, 0), pasos.length - 1)
  return { slide, step: Math.min(Math.max(pos.step, 0), pasos[slide]) }
}

const entero = (v: string | null) => (v !== null && /^\d+$/.test(v) ? Number(v) : null)

export function leerURL(search: string): Ruta {
  const q = new URLSearchParams(search)
  return {
    charla: q.get('charla'),
    pos: { slide: Math.max((entero(q.get('slide')) ?? 1) - 1, 0), step: entero(q.get('step')) ?? 0 },
    presenter: q.get('presenter') === '1',
  }
}

export function escribirURL(r: Ruta): string {
  const q = new URLSearchParams()
  if (r.charla) {
    q.set('charla', r.charla)
    q.set('slide', String(r.pos.slide + 1))
    if (r.pos.step > 0) q.set('step', String(r.pos.step))
  }
  if (r.presenter) q.set('presenter', '1')
  const s = q.toString()
  return s ? `?${s}` : location.pathname
}

// Autochequeo: corre solo en desarrollo y avisa en consola si la navegación se rompe.
if (import.meta.env.DEV) {
  const pasos = [0, 2, 0]
  const igual = (a: unknown, b: unknown, que: string) => console.assert(JSON.stringify(a) === JSON.stringify(b), `state.ts: ${que}`, a, b)
  let p: Pos = { slide: 0, step: 0 }
  const camino = Array.from({ length: 6 }, () => (p = mover(p, 'next', pasos)))
  igual(camino, [{ slide: 1, step: 0 }, { slide: 1, step: 1 }, { slide: 1, step: 2 }, { slide: 2, step: 0 }, { slide: 2, step: 0 }, { slide: 2, step: 0 }], 'next recorre pasos y frena al final')
  igual(mover({ slide: 2, step: 0 }, 'prev', pasos), { slide: 1, step: 2 }, 'prev cae en el último paso de la anterior')
  igual(mover({ slide: 0, step: 0 }, 'prev', pasos), { slide: 0, step: 0 }, 'prev frena al principio')
  igual(acotar({ slide: 9, step: 9 }, pasos), { slide: 2, step: 0 }, 'acotar mete la posición en rango')
  const r: Ruta = { charla: 'solana', pos: { slide: 2, step: 1 }, presenter: true }
  igual(leerURL(escribirURL(r)), r, 'la URL ida y vuelta da la misma ruta')
}
