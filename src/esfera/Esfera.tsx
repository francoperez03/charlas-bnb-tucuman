import { useContext, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { SlideCtx } from '../deck/slide'
import { reducedMotion } from '../motion/motion'

/**
 * La esfera es el agente. Port de AgentSphere.tsx (Crisol, apps/landing2) con la identidad BNB.
 * Cinco cáscaras anidadas, de adentro hacia afuera: LLM; system prompt y tools (la misma cáscara, mitad de arriba y
 * mitad de abajo: las dos son la parte fija del contexto); memoria; guardrails; wallet e identidad, que también
 * enciende la malla de meridianos y paralelos.
 * Un cuarto de adelante ("gajo") se desprende con `gajo` (0..1) y deja ver las capas cortadas.
 * `encendida` enciende una capa (las otras bajan). Sin reduced motion gira apenas y respira.
 */
const RADIOS = [0.3, 0.5, 0.68, 0.85, 1.0]
// Cámara cerca: la esfera llena ~75 % de su caja. El gajo caído queda justo adentro del encuadre.
const DESCENSO = 0.8
const CAMARA_Z = 4.6
const ESFERA_Y = 0.4
const CARA_Y = Math.PI / 4 // la bisectriz del gajo (x < 0, z > 0) queda sobre +z: el corte mira a cámara y se ven las capas
const INCLINACION = 0.3
const AMARILLO = '#f0b90b'
const TINTA = '#efeee6'
const CASCARA = '#0e0e0e'
const EXTERIOR = '#141414'
const CARAS = ['#f0b90b', '#efeee6', '#0b0e11', '#f0b90b', '#0b0e11']
// Modo `tenue`: cada capa con un tono oscuro propio; solo la encendida brilla (emissive amarillo).
const TENUES = ['#4a3a0c', '#3a3832', '#2f2c26', '#2c2618', '#3b2e10', '#26241f'] // por capa
// Capas de cada cáscara, de arriba abajo: la cáscara 1 se parte al medio entre system prompt (1) y tools (2).
const PARTES = [[0], [1, 2], [3], [4], [5]]
const CAPAS_N = 6

export type EsferaProps = {
  encendida?: number // capa encendida: 0 LLM, 1 system prompt, 2 tools, 3 memory, 4 guardrails, 5 wallet e identidad, -1 ninguna
  gajo?: number // 0 entera, 1 el gajo caído del todo
  escala?: number
  sinGajo?: boolean // oculta el cuarto que se desprende: queda el corte abierto sin la pieza
  tenue?: boolean // capas oscuras y distintas; solo la encendida brilla
  onElegir?: (i: number | null) => void
}

const suavizar = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)
const acotar = (v: number) => Math.min(1, Math.max(0, v))

// Parametrización de SphereGeometry: x = -cos φ, z = sin φ.
const curva = (f: (t: number) => THREE.Vector3, a: number, b: number, n = 64) =>
  new THREE.BufferGeometry().setFromPoints(Array.from({ length: n + 1 }, (_, i) => f(a + ((b - a) * i) / n)))
const ecuador = (r: number, f0: number, f1: number) => curva((t) => new THREE.Vector3(-r * Math.cos(t), 0, r * Math.sin(t)), f0, f1)
const paralelo = (r: number, lat: number, f0: number, f1: number) =>
  curva((t) => new THREE.Vector3(-r * Math.cos(lat) * Math.cos(t), r * Math.sin(lat), r * Math.cos(lat) * Math.sin(t)), f0, f1)
const meridiano = (r: number, f: number) =>
  curva((t) => new THREE.Vector3(-r * Math.cos(f) * Math.sin(t), r * Math.cos(t), r * Math.sin(f) * Math.sin(t)), 0, Math.PI)

type Mat = THREE.MeshStandardMaterial

function Escena({ encendida = -1, gajo = 0, escala = 1, sinGajo = false, tenue = false, onElegir, animar }: EsferaProps & { animar: boolean }) {
  const raiz = useRef<THREE.Group>(null)
  const cuerpo = useRef<THREE.Group>(null)
  const cuarto = useRef<THREE.Group>(null)
  const mats = useRef<Mat[][]>(Array.from({ length: CAPAS_N }, () => []))
  const { camera, size, invalidate } = useThree()
  const reloj = useRef(0)
  const gajoActual = useRef(gajo)

  useEffect(() => {
    const aspecto = size.width / Math.max(1, size.height)
    camera.position.set(0, 0, CAMARA_Z * Math.max(1, 1.1 / aspecto))
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [size, camera])
  // En modo quieto (miniaturas, reduced motion) no hay loop: se pide un cuadro por cambio de props.
  useEffect(() => { if (!animar) { gajoActual.current = gajo; invalidate() } }, [animar, gajo, encendida, escala, invalidate])

  const R = RADIOS[RADIOS.length - 1]
  const geo = useMemo(() => {
    // Por cáscara, una entrada por parte: la parte j de n cubre la franja polar [πj/n, π(j+1)/n] y su cuarto de cara.
    const partes = (f: (r: number, i: number, t0: number, dt: number) => THREE.BufferGeometry) =>
      RADIOS.map((r, i) => PARTES[i].map((_, j, ps) => f(r, i, (Math.PI * j) / ps.length, Math.PI / ps.length)))
    const cuerpo = partes((r, i, t0, dt) => (i === 0 ? new THREE.SphereGeometry(r, 48, 32) : new THREE.SphereGeometry(r, 72, 48, Math.PI / 2, Math.PI * 1.5, t0, dt)))
    const pieza = partes((r, _i, t0, dt) => new THREE.SphereGeometry(r, 48, 32, 0, Math.PI / 2, t0, dt))
    const cara = partes((r, i, t0, dt) => (i === 0 ? new THREE.CircleGeometry(r, 48, Math.PI / 2 + t0, dt) : new THREE.RingGeometry(RADIOS[i - 1], r, 48, 1, Math.PI / 2 + t0, dt)))
    const linea = (g: THREE.BufferGeometry, op: number, color = TINTA) => { const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: op })); l.userData.base = op; l.userData.amarilla = color === AMARILLO; return l }
    const lineas = {
      cuerpo: [
        linea(ecuador(R + 0.004, Math.PI * 0.5, Math.PI * 2), 0.7, AMARILLO),
        ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((k) => linea(meridiano(R + 0.004, Math.PI * 0.5 + (Math.PI / 6) * k), k % 3 === 0 ? 0.3 : 0.14)),
        ...[-2, -1, 1, 2].map((k) => linea(paralelo(R + 0.004, (Math.PI / 6) * k, Math.PI * 0.5, Math.PI * 2), 0.16)),
      ],
      pieza: [
        linea(ecuador(R + 0.004, 0, Math.PI * 0.5), 0.7, AMARILLO),
        ...[1, 2].map((k) => linea(meridiano(R + 0.004, (Math.PI / 6) * k), 0.14)),
        ...[-2, -1, 1, 2].map((k) => linea(paralelo(R + 0.004, (Math.PI / 6) * k, 0, Math.PI * 0.5), 0.16)),
      ],
      caraXY: RADIOS.map((r) => linea(meridiano(r, 0), 0.6, AMARILLO)),
      caraYZ: RADIOS.map((r) => linea(meridiano(r, Math.PI * 0.5), 0.6, AMARILLO)),
    }
    const todas = [...lineas.cuerpo, ...lineas.pieza, ...lineas.caraXY, ...lineas.caraYZ]
    return { cuerpo, pieza, cara, lineas, todas }
  }, [R])

  useFrame((_, dt) => {
    reloj.current += dt
    const t = reloj.current
    if (animar) gajoActual.current += (gajo - gajoActual.current) * 0.06
    const caida = suavizar(acotar(gajoActual.current))
    if (raiz.current) {
      raiz.current.rotation.y = CARA_Y + (animar ? Math.sin(t * 0.3) * 0.1 : 0)
      raiz.current.position.set(0, ESFERA_Y, 0)
      raiz.current.scale.setScalar(escala)
    }
    // Respira apenas: ±1,2 %, ciclo de 3,2 s.
    if (cuerpo.current) cuerpo.current.scale.setScalar(animar ? 1 + 0.012 * Math.sin((t * Math.PI * 2) / 3.2) : 1)
    if (cuarto.current) cuarto.current.position.set(-0.85 * caida, -DESCENSO * caida, 0.45 * caida)
    // La malla es la capa 5: se enciende entera (amarilla y más opaca) cuando le toca.
    const malla = encendida === CAPAS_N - 1
    geo.todas.forEach((l) => {
      const m = l.material as THREE.LineBasicMaterial
      const base = l.userData.base as number
      m.opacity += (Math.min(1, malla ? base * 2.5 : base) - m.opacity) * (animar ? 0.1 : 1)
      m.color.set(malla ? AMARILLO : l.userData.amarilla ? AMARILLO : TINTA)
    })
    mats.current.forEach((ms, i) => {
      const viva = encendida === i
      const apagada = encendida >= 0 && !viva
      const meta = tenue ? (viva ? 0.9 : 0) : viva ? 0.6 : apagada ? 0.03 : i === 0 ? 0.6 : 0.07
      ms.forEach((m) => { m.emissiveIntensity += (meta - m.emissiveIntensity) * (animar ? 0.1 : 1) })
    })
  })

  // i es la cáscara (forma y color de base); c, la capa que la enciende.
  const material = (i: number, c: number, cara = false) => (
    <meshStandardMaterial
      ref={(m) => { if (m && !mats.current[c].includes(m)) mats.current[c].push(m) }}
      color={tenue ? (cara || i === 0 ? TENUES[c] : i === RADIOS.length - 1 ? EXTERIOR : CASCARA) : i === 0 ? AMARILLO : cara ? CARAS[i] : i === RADIOS.length - 1 ? EXTERIOR : CASCARA}
      emissive={AMARILLO}
      emissiveIntensity={tenue ? 0 : i === 0 ? 0.6 : 0.07}
      roughness={0.75}
      side={THREE.DoubleSide}
    />
  )
  const elegir = (i: number) => onElegir ? {
    onPointerOver: (e: { stopPropagation: () => void }) => { e.stopPropagation(); onElegir(i) },
    onPointerOut: () => onElegir(null),
  } : {}

  return (
    <group ref={raiz} rotation={[INCLINACION, CARA_Y, 0]}>
      <group ref={cuerpo}>
        {PARTES.map((ps, i) => ps.map((c, j) => <mesh key={c} geometry={geo.cuerpo[i][j]} {...elegir(c)}>{material(i, c)}</mesh>))}
        {PARTES.map((ps, i) => ps.map((c, j) => (
          <group key={`c${c}`}>
            <mesh geometry={geo.cara[i][j]}>{material(i, c, true)}</mesh>
            <mesh geometry={geo.cara[i][j]} rotation={[0, Math.PI / 2, 0]}>{material(i, c, true)}</mesh>
          </group>
        )))}
        {geo.lineas.cuerpo.map((l, k) => <primitive key={k} object={l} />)}
      </group>
      <group ref={cuarto} visible={!sinGajo}>
        {PARTES.map((ps, i) => ps.map((c, j) => <mesh key={`p${c}`} geometry={geo.pieza[i][j]} {...elegir(c)}>{material(i, c)}</mesh>))}
        {PARTES.map((ps, i) => ps.map((c, j) => (
          <group key={`pc${c}`}>
            <mesh geometry={geo.cara[i][j]} {...elegir(c)}>{material(i, c, true)}</mesh>
            <mesh geometry={geo.cara[i][j]} rotation={[0, Math.PI / 2, 0]} {...elegir(c)}>{material(i, c, true)}</mesh>
          </group>
        )))}
        {geo.lineas.pieza.map((l, k) => <primitive key={k} object={l} />)}
        {geo.lineas.caraXY.map((l, k) => <primitive key={`xy${k}`} object={l} position={[0, 0, 0.003]} />)}
        {geo.lineas.caraYZ.map((l, k) => <primitive key={`yz${k}`} object={l} position={[0.003, 0, 0]} />)}
      </group>
    </group>
  )
}

export default function Esfera(props: EsferaProps) {
  // Dentro de una slide, `animar` viene del deck (false en las miniaturas del presentador). En el menú siempre anima.
  const { animar } = useContext(SlideCtx)
  const vivo = animar && !reducedMotion()
  return (
    <Canvas
      dpr={[1, 1.5]}
      resize={{ offsetSize: true }}
      frameloop={vivo ? 'always' : 'demand'}
      camera={{ position: [0, 0, CAMARA_Z], fov: 32 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      style={{ position: 'absolute', inset: 0 }}
      aria-hidden
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[-4, 5, 6]} intensity={2.2} color="#ffffff" />
      <directionalLight position={[4, -2, 3]} intensity={0.35} color={AMARILLO} />
      <Escena {...props} animar={vivo} />
    </Canvas>
  )
}
