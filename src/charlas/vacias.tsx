import { WordsIn } from '../motion/motion'
import { Paso, type Slide } from '../deck/slide'

// Cinco slides de relleno para probar la estructura. Cada charla reemplaza las suyas en su archivo.
// La segunda trae dos pasos de ejemplo: aparecen de a uno con →.
export const vacias = (charla: string, archivo: string): Slide[] =>
  [1, 2, 3, 4, 5].map((n) => ({
    titulo: `Slide ${n} · vacía`,
    pasos: n === 2 ? 2 : 0,
    notas: `Guion de la slide ${n} de "${charla}".\n\nLo que escribas en "notas" aparece acá, en el modo presentador, y no se ve en el proyector.`,
    contenido: () => (
      <div className="vacia">
        <p className="kicker" data-in>{charla}</p>
        <p className="numero" data-in>{String(n).padStart(2, '0')}</p>
        <h1><WordsIn text={`Slide ${n} · vacía`} /></h1>
        <p className="cuerpo" data-in>Reemplazá este contenido en <code>src/charlas/{archivo}</code></p>
        {n === 2 && (
          <div className="pasos-demo">
            <Paso n={1}><p className="cuerpo">Paso 1: aparece al tocar →</p></Paso>
            <Paso n={2}><p className="cuerpo">Paso 2: y este, al tocarla de nuevo</p></Paso>
          </div>
        )}
      </div>
    ),
  }))
