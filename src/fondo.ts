// Fondo de todo el sitio (menú y charlas), hecho con vgpu (WebGPU). Cuatro capas en un shader:
// la cuadrícula (corre un paso por slide: `avance`), una luz amarilla y una gris que derivan solas,
// y un destello amarillo que se dispara desde una slide (`pulso`).
// Es decorativo: sin WebGPU no se dibuja nada y queda el CSS de siempre.
// Patrón de arranque y limpieza de la guía de vgpu para React (npx vgpu docs cat nextjs.md).
import { clock, effect, frameLoop, init, surface } from 'vgpu'
import type { FrameLoopHandle } from 'vgpu'

export type FondoParams = { avance: number; pulso: number }
export type Fondo = { parar: () => void; set: (p: Partial<FondoParams>) => void }

const SHADER = /* wgsl */ `
struct Params { time: f32, avance: f32, pulso: f32, _pad: f32, texel: vec2f }
@group(0) @binding(0) var<uniform> params: Params;

fn mancha(uv: vec2f, centro: vec2f, aspecto: f32, radio: f32) -> f32 {
  let d = (uv - centro) * vec2f(aspecto, 1.0);
  return exp(-dot(d, d) / (radio * radio));
}
fn grano(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(12.9898, 78.233))) * 43758.5453);
}
// Línea de la cuadrícula: 1 px de ancho, cada \`paso\` px, con el corrimiento en px.
fn linea(px: f32, paso: f32, corr: f32) -> f32 {
  let f = fract((px + corr) / paso) * paso;
  return 1.0 - smoothstep(0.0, 1.2, min(f, paso - f));
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let t = params.time;
  let px = uv / params.texel;
  let aspecto = params.texel.y / params.texel.x;
  let amarillo = vec3f(0.945, 0.788, 0.129);
  let gris = vec3f(0.42, 0.42, 0.42);

  // Cuadrícula de 60 px que corre un paso entero por slide, y una línea mayor cada 5.
  let corr = params.avance * 60.0;
  let menor = max(linea(px.x, 60.0, corr), linea(px.y, 60.0, 0.0));
  let mayor = max(linea(px.x, 300.0, corr), linea(px.y, 300.0, 0.0));
  var color = vec3f(1.0) * (menor * 0.035 + mayor * 0.03);

  // Luz amarilla que deriva despacio por la derecha y respira.
  let respira = 0.85 + 0.15 * sin(t * 0.9);
  let a = mancha(uv, vec2f(0.72 + 0.10 * sin(t * 0.11), 0.62 + 0.10 * cos(t * 0.13)), aspecto, 0.36) * respira;
  let b = mancha(uv, vec2f(0.22 + 0.08 * cos(t * 0.09), 0.78 + 0.10 * sin(t * 0.07)), aspecto, 0.55);
  color += amarillo * a * 0.11 + gris * b * 0.10;
  // La cuadrícula se tiñe de amarillo donde está la luz.
  color += amarillo * menor * a * 0.35;

  // Destello: un flash amarillo desde el centro, lo dispara una slide.
  color += amarillo * params.pulso * (0.06 + 0.18 * mancha(uv, vec2f(0.5, 0.5), aspecto, 0.6));

  color += (grano(px + fract(t) * 61.0) - 0.5) * 0.018;
  return vec4f(max(color, vec3f(0.0)), 1.0);
}
`

/** Arranca el fondo sobre \`canvas\`. \`quieto\` deja el tiempo en 0 (reduced motion). */
export function iniciarFondo(canvas: HTMLCanvasElement, quieto: boolean): Fondo {
  let cortado = false
  let loop: FrameLoopHandle | undefined
  let gpu: Awaited<ReturnType<typeof init>> | undefined
  let fx: ReturnType<typeof effect> | undefined
  const estado = { avance: 0, pulso: 0 }

  void (async () => {
    try {
      gpu = await init()
      if (cortado) return gpu.dispose()
      const lienzo = surface(gpu, canvas, { dpr: [1, 1.5] })
      fx = effect(gpu, SHADER, { label: 'fondo', set: { params: { time: 0, avance: 0, pulso: 0, _pad: 0, texel: lienzo.texelSize } } })
      lienzo.onResize(() => fx?.set({ params: { texel: lienzo.texelSize } }))
      canvas.dataset.listo = '1'
      document.body.dataset.gpu = '1' // el CSS apaga su cuadrícula: la dibuja el shader
      const reloj = clock(gpu)
      // ponytail: con movimiento reducido el tiempo queda en 0 y se redibuja el mismo cuadro; un único frame() al
      // iniciar y en cada resize gastaría menos, pero choca con el ciclo de resize de vgpu (frameReentrantError).
      loop = frameLoop(gpu, (f) => {
        fx?.set({ params: { time: quieto ? 0 : reloj.time, avance: estado.avance, pulso: estado.pulso } })
        f.pass(lienzo, fx!)
      })
    } catch {
      gpu?.dispose() // sin adaptador o shader rechazado: queda el fondo de CSS
    }
  })()

  return {
    set: (p) => Object.assign(estado, p),
    parar: () => {
      cortado = true
      delete document.body.dataset.gpu
      loop?.stop()
      gpu?.dispose()
    },
  }
}
