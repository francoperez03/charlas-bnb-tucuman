import { pub } from '../pub'
import { WordsIn } from '../motion/motion'
import { useContext } from 'react'
import { SlideCtx, type Charla } from '../deck/slide'
import { EQUIPO } from './equipo'
import { LATAM, PUNTOS } from './latam'

// Fuente: agenda.md (la noche) y el calendario de Luma de BNB Chain LatAm (capturas de Franco, 2026-10-21).
// Cada slide es una columna del alto del lienzo (.bv): el título arriba y el contenido anclado abajo.

// Builder Sessions de BNB Chain LatAm en 2026, en orden. `ciudad` es la clave en PUNTOS.
type Sesion = { ciudad: string; pais: string; fecha: string; hecha: boolean }
const SESIONES: Sesion[] = [
  { ciudad: 'Buenos Aires', pais: 'AR', fecha: '8 jul', hecha: true },
  { ciudad: 'Córdoba', pais: 'AR', fecha: '29 jul', hecha: true },
  { ciudad: 'Lima', pais: 'PE', fecha: '31 jul', hecha: true },
  { ciudad: 'Cochabamba', pais: 'BO', fecha: '18 ago', hecha: true },
  { ciudad: 'Mar del Plata', pais: 'AR', fecha: 'sep', hecha: true }, // [INPUT] día exacto, la captura lo corta
  { ciudad: 'Salta', pais: 'AR', fecha: '26 sep', hecha: true },
  { ciudad: 'Santa Cruz', pais: 'BO', fecha: '3 oct', hecha: true },
  { ciudad: 'Montevideo', pais: 'UY', fecha: '15 oct', hecha: true },
  { ciudad: 'Mendoza', pais: 'AR', fecha: '17 oct', hecha: true },
  { ciudad: 'Tucumán', pais: 'AR', fecha: '22 oct', hecha: false },
  { ciudad: 'Lima', pais: 'PE', fecha: '14 nov', hecha: false },
  { ciudad: 'Santiago', pais: 'CL', fecha: '11 dic', hecha: false },
]
const PAISES = new Set(SESIONES.map((s) => s.pais)).size

// Cronograma de la noche: [inicio, fin, bloque]. Los nombres de las charlas son los del menú.
const HOY: [string, string, string][] = [
  ['18:00', '18:30', 'Ingreso'], ['18:30', '19:00', 'BNB Agent Studio'], ['19:00', '21:00', 'Build session'],
  ['21:00', '21:30', 'Pitch de equipos'], ['21:30', '21:40', 'Cierre'],
]
const min = (h: string) => { const [a, b] = h.split(':').map(Number); return a * 60 + b }
const DIA = [min('18:00'), min('21:40')]
const pct = (h: string) => ((min(h) - DIA[0]) / (DIA[1] - DIA[0])) * 100
const HORAS = ['18', '19', '20', '21']

function Equipo() {
  return (
    <div className="bv-equipo">
      {EQUIPO.map((p) => (
        <figure key={p.nombre} data-in>
          <img className="bv-foto" src={p.foto} alt="" />
          <figcaption>
            <b>{p.nombre}</b>
            {p.rol && <span>{p.rol}</span>}
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

function Qrs() {
  return (
    <div className="bv-qrs">
      {EQUIPO.map((p) => (
        <figure key={p.nombre} data-in>
          <div className="bv-qr-par">
            <img className="bv-qr-foto" src={p.foto} alt="" />
            {p.qr && <img className="bv-qr-img" src={p.qr.img} alt={`QR al ${p.qr.red} de ${p.nombre}`} />}
          </div>
          <figcaption>{p.nombre}</figcaption>
        </figure>
      ))}
    </div>
  )
}

// Dónde va el nombre de cada ciudad respecto de su punto (varias caen pegadas en el Río de la Plata).
const ETIQUETA: Record<string, { dx: number; dy: number; fin?: boolean }> = {
  Lima: { dx: 10, dy: 0 }, Cochabamba: { dx: -10, dy: 0, fin: true }, 'Santa Cruz': { dx: 10, dy: 0 },
  Salta: { dx: 10, dy: -3 }, Tucumán: { dx: 12, dy: 3 }, Córdoba: { dx: -10, dy: -2, fin: true }, Mendoza: { dx: -10, dy: -6, fin: true },
  Santiago: { dx: -10, dy: 10, fin: true }, 'Buenos Aires': { dx: -10, dy: 2, fin: true }, Montevideo: { dx: 10, dy: 2 }, 'Mar del Plata': { dx: 10, dy: 6 },
}

// Mapa de Latinoamérica: las sesiones hechas de entrada; con → (paso 1) entran las que faltan y Tucumán se marca.
function Latam() {
  const { step } = useContext(SlideCtx)
  const todas = step >= 1
  const visibles = SESIONES.filter((s) => todas || s.hecha)
  const hechas = SESIONES.filter((s) => s.hecha).length
  return (
    <div className="bv-latam" data-todas={todas || undefined} data-in>
      <div className="bv-latam-texto">
        <div className="bv-latam-a">
          <span className="bv-etq">2026 · {hechas} sesiones en {PAISES} países</span>
          <p><b>BNB Chain LatAm</b> recorre la región enseñando a construir sobre BNB Chain.</p>
        </div>
        <div className="bv-latam-b">
          <span className="bv-etq">Hoy · sesión {hechas + 1} de {SESIONES.length}</span>
          <p>Le toca a <b>Tucumán</b>.</p>
        </div>
        <ol className="bv-sesiones">
          {SESIONES.map((s, i) => (
            <li key={s.ciudad + s.fecha} className={s.ciudad === 'Tucumán' ? 'bv-aca' : s.hecha ? undefined : 'bv-falta'}>
              <span>{s.fecha}</span><b>{s.ciudad}</b><i>{s.pais}</i>
              {i === hechas - 1 && <em aria-hidden />}
            </li>
          ))}
        </ol>
      </div>
      {/* Recorte del lienzo del mapa: de Lima al Río de la Plata, con la Patagonia fundida abajo. */}
      <svg viewBox="40 110 300 420" role="img" aria-label={`Mapa de Latinoamérica con las Builder Sessions: ${SESIONES.map((s) => s.ciudad).join(', ')}`}>
        <defs>
          {/* la máscara funde los bordes del recorte (arriba, abajo y a la derecha) para que el continente no termine en una línea recta */}
          <linearGradient id="bv-fundido-v" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000" /><stop offset="0.14" stopColor="#fff" /><stop offset="0.78" stopColor="#fff" /><stop offset="1" stopColor="#000" />
          </linearGradient>
          <linearGradient id="bv-fundido-h" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0.72" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" />
          </linearGradient>
          <mask id="bv-mascara">
            <rect x="40" y="110" width="300" height="420" fill="url(#bv-fundido-v)" />
            <rect x="40" y="110" width="300" height="420" fill="url(#bv-fundido-h)" />
          </mask>
        </defs>
        <path className="bv-paises" d={LATAM.paises} mask="url(#bv-mascara)" />
        <g className="bv-puntos">
          {visibles.map((s) => {
            const [x, y] = PUNTOS[s.ciudad]
            const e = ETIQUETA[s.ciudad]
            const aca = s.ciudad === 'Tucumán'
            return (
              <g key={s.ciudad + s.fecha} className={aca ? 'bv-aca' : s.hecha ? undefined : 'bv-falta'}>
                <circle cx={x} cy={y} r={aca ? 6 : 3.5} />
                {(s.hecha || aca || s.ciudad !== 'Lima') && (
                  <text x={x + e.dx} y={y + e.dy} textAnchor={e.fin ? 'end' : 'start'} dominantBaseline="middle">{s.ciudad}</text>
                )}
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}

export const bienvenidos: Charla = {
  slug: 'bienvenidos',
  titulo: 'Bienvenidos',
  bajada: 'Quiénes somos, qué es BNB Builder Session y cómo sigue la noche',
  minutos: 10,
  slides: [
    {
      titulo: 'Portada',
      notas: '¿Se acuerdan de la mano levantada del principio? (pausa) A las 21, esa persona de su familia puede tener un agente que le venda mientras ella atiende lo suyo.\n\n[INPUT Franco: la frase que querés que se lleven.]\n\nNos encuentran en las mesas. Los QR son para seguirnos y escribirnos cuando quieran, también después de hoy.\n\nA construir.',
      contenido: () => (
        <div className="bv bv-portada">
          <p className="kicker" data-in>Jueves 22 de octubre · UTN FRT · Tucumán</p>
          <div>
            <h1><WordsIn text="BNB Builder Session" /></h1>
            <p className="bv-x" data-in>× Tucumán</p>
          </div>
          <div className="bv-logos" data-in>
            <img src={pub("/bnb-chain-logo-vertical.png")} alt="BNB Chain" />
            <img src={pub("/logo-crisol-mono.svg")} alt="Crisol" />
            <span className="bv-pcn" role="img" aria-label="PCN"><span aria-hidden>PCN</span><img src={pub("/logo-pcn-isotipo.png")} alt="" /></span>
            <img src={pub("/logo-sistemas-1.png")} alt="Ingeniería en Sistemas de Información" />
            <img src={pub("/logo-sistemas-2.png")} alt="40 años · Ingeniería en Sistemas de Información · UTN FRT" />
            <img src={pub("/logo-undercode.png")} alt="Undercode" />
          </div>
          <img className="bv-carpincho" src={pub("/mascota-carpincho.png")} alt="" data-in />
          <a className="bv-qr-sitio" href="https://charlas-bnb-tucuman.vercel.app" data-in>
            <img src={pub("/img/qr-sitio.svg")} alt="QR al sitio de las charlas" />
            <span>Escaneá y seguí<br />las slides en tu celu</span>
          </a>
        </div>
      ),
    },
    {
      titulo: 'Quiénes somos',
      notas: 'Somos tres, y los tres estuvimos del lado de ustedes.\n\n[INPUT Franco: por qué hacemos esto en Tucumán, en una o dos frases tuyas.]\n\n[INPUT Franco: un momento tuyo de "construí algo y funcionó", en una frase.]\n\nAlejo y Nacho van a andar por las mesas toda la noche. Cualquier traba, nos buscan.\n\nY esto que hacemos hoy viene de lejos.',
      contenido: () => (
        <div className="bv">
          <h1><WordsIn text="Quiénes somos" /></h1>
          <Equipo />
        </div>
      ),
    },
    {
      titulo: 'Builder Sessions en Latinoamérica',
      pasos: 1,
      notas: 'Esto ya pasó en nueve ciudades. Buenos Aires, Córdoba, Lima, Cochabamba, Mar del Plata, Salta, Santa Cruz, Montevideo, Mendoza. En cada una, una sala como esta y una noche para construir.\n\n[INPUT si hay: algo que salió de una sesión anterior, un proyecto o una persona.]\n\n→ Hoy el punto amarillo es Tucumán. (pausa) Y lo que pase en este mapa esta noche depende de esta sala.\n\nAsí va a ser la noche.',
      contenido: () => (
        <div className="bv">
          <h1><WordsIn text="Builder Sessions" /></h1>
          <Latam />
        </div>
      ),
    },
    {
      titulo: 'Hoy',
      notas: 'Así sigue la noche.\n\nAhora, media hora para entender qué vamos a construir: un agente que vende. Después dos horas de construir, con nosotros en las mesas.\n\nA las 21, los equipos que quieran muestran lo que hicieron, en dos minutos. (pausa) A las 21 va a existir algo que ahora no existe. Y lo van a haber hecho ustedes.\n\nArrancamos.',
      contenido: () => (
        <div className="bv">
          <h1><WordsIn text="Hoy" /></h1>
          <div className="bv-dia" data-in>
            <div className="bv-dia-horas" aria-hidden>
              {HORAS.map((h) => <span key={h} style={{ left: `${pct(`${h}:00`)}%` }}>{h}</span>)}
            </div>
            <ol>
              {HOY.map(([ini, fin, nombre], i) => (
                <li key={ini} className={i === 1 ? 'bv-ahora' : undefined}>
                  <span className="bv-dia-ini">{ini}</span>
                  <span className="bv-dia-nombre">{nombre}</span>
                  <span className="bv-dia-pista"><i style={{ left: `${pct(ini)}%`, width: `${pct(fin) - pct(ini)}%` }} /></span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ),
    },
    {
      titulo: 'En las mesas',
      notas: '¿Se acuerdan de la mano levantada del principio? (pausa) A las 21, quiero ver más manos.\n\n[INPUT Franco: la frase que querés que se lleven.]\n\nBienvenidos. Los QR son para seguirnos, escríbannos cuando quieran, también después de hoy.\n\n→ sigue BNB Agent Studio.',
      contenido: () => (
        <div className="bv bv-cierre">
          <div>
            <h1><WordsIn text="En las mesas" /></h1>
            <p className="bv-bajada bv-gap-s" data-in>A las 21, el negocio de tu familia <span className="bv-ojo">puede tener un agente que vende</span>.</p>
          </div>
          <Qrs />
        </div>
      ),
    },
  ],
}
