# Charlas · BNB Builder Session Tucumán

Sitio de las charlas del jueves 22 de octubre de 2026 en la UTN FRT (SUM 3, Rivadavia 1050). Copia pelada del sitio de Road to Colosseum (`../../2026-09-28-superteam-colosseum/charlas/`) con la paleta negro y amarillo de BNB.

En vivo: https://charlas-bnb-tucuman.vercel.app (proyecto `charlas-bnb-tucuman` en Vercel, cuenta `francoperez03s-projects`, publicado el 2026-10-21 desde la CLI, sin repo). Publicar: `npm run build && vercel deploy --prod --yes --scope francoperez03s-projects`. [INPUT] repo en GitHub; `scripts/pages.sh` ya apunta a `charlas-bnb-tucuman` para el respaldo en Pages cuando exista.

## Qué es

Un menú con tres charlas y un deck por charla, sobre un lienzo fijo de 1920×1080 que se escala a cualquier pantalla. Bienvenidos está lista; las otras dos usan `vacias(...)`: cinco slides de relleno cada una.

| Charla | Archivo | Bloque de `agenda.md` |
|---|---|---|
| Bienvenidos (portada, equipo, mapa de Builder Sessions, cronograma, QR) | `src/charlas/bienvenidos.tsx` | 18:30, apertura |
| BNB Agent Studio | `src/charlas/workshop.tsx` | 18:30 Workshop · 16 slides con esfera y coreografía propia, 2026-10-21 |
| Build session | `src/charlas/build.tsx` | 19:00 Build session · todavía `vacias(...)`; la idea es que el paso a paso sea una skill que se le da a la gente, no un deck |

Los comandos y el código no van en el deck del workshop: viven en el repo del ejemplo (`[INPUT]`, constante `REPO` en `workshop.tsx`) y en la skill de la build session.

## Correrlo

```bash
npm install
npm run dev     # http://localhost:5182
npm run build
```

## Teclado

| Tecla | Qué hace |
|---|---|
| → , espacio, AvPág | Avanza (primero los pasos de la slide, después la slide) |
| ← , RePág | Vuelve |
| Inicio / Fin | Primera y última slide |
| F | Pantalla completa |
| P | Abre el modo presentador en otra ventana |
| Esc | Vuelve al menú |

El modo presentador muestra la slide actual, la siguiente, un cronómetro y el guion, y se mueve junto con la ventana del proyector (canal `charlas-bnb`).

## Sumar una slide

Cada charla es una lista de objetos `{ titulo, pasos?, notas?, contenido }` en `src/charlas/<charla>.tsx`. Piezas:

- `<WordsIn text="..." />` dentro de un `h1`: título que entra palabra por palabra.
- `<Paso n={1}>...</Paso>`: aparece recién en ese paso (declarar `pasos: N` en la slide).
- Atributo `data-in` en cualquier elemento: entra con la slide.
- Clases de tipografía en `src/styles.css`: `.kicker`, `h1`, `.cuerpo`, `code`. Todo adentro del lienzo se mide en px.
- `notas`: guion, se ve solo en el modo presentador.
- Imágenes en `public/img/`, se usan con `pub('/img/nombre.png')`.

## Mapa de Builder Sessions

`src/charlas/latam.ts` trae Sudamérica proyectada (Mercator, generado una vez con d3-geo y world-atlas) y las ciudades con sesión. La lista de sesiones, con fecha y si ya se hizo, es `SESIONES` en `bienvenidos.tsx`: sale de las capturas del calendario de Luma de BNB Chain LatAm del 2026-10-21. [INPUT] el día de Mar del Plata (la captura lo corta). Equipo, fotos y QR en `src/charlas/equipo.ts` y `public/img/` (Franco, Alejandro Colchi, Ignacio Mohamed). La foto de Ignacio es un recorte de `../assets/foto-ignacio-mohamed.jpeg`; su QR apunta a su LinkedIn.

La portada lleva los mismos logos que la placa (`public/logo-sistemas-1.png`, `logo-sistemas-2.png` y `logo-undercode.png` salen de `../assets/placa-utn/logos/`, reducidos a 160 px de alto) y `public/img/qr-sitio.svg`, un QR a este mismo sitio para seguir las slides desde el celular. Regenerar un QR:

```bash
node -e "require('qrcode').toFile('public/img/qr-<quien>.svg','<url>',{type:'svg',margin:2,color:{dark:'#000000ff',light:'#efeee6ff'}})"
```

## Mascota

`public/mascota-carpincho.png` es el carpincho de PCN con el logo de BNB Chain pegado en la tapa de la notebook (en el original decía PCN). Lo genera `scripts/carpincho-bnb.py` a partir del original, que sigue en `../../2026-09-28-superteam-colosseum/charlas/public/mascota-carpincho.png`:

```bash
python3 scripts/carpincho-bnb.py ../../2026-09-28-superteam-colosseum/charlas/public/mascota-carpincho.png public/mascota-carpincho.png
```

Necesita PIL y numpy. Las esquinas de la tapa están medidas a mano en el script.

## Esfera

`src/esfera/` es el agente en 3D (port de `AgentSphere.tsx` de la landing 2 de Crisol, con three y R3F 8, en su propio chunk). Cinco capas anidadas, de adentro hacia afuera: LLM, prompt, herramientas, memoria, guardrails. La malla de meridianos y paralelos es la wallet e identidad. Props: `encendida` (0 LLM … 4 guardrails, 5 la malla, -1 ninguna), `gajo` (0 entera, 1 el cuarto de adelante caído del todo, deja ver las capas cortadas), `escala`, `onElegir` (hover por capa). Está en el menú, la portada, las piezas (se enciende la capa del paso), las piezas en archivos (se desarma con cada paso) y el cierre. En las miniaturas del presentador y con reduced motion no gira ni respira.

## Fondo

`src/fondo.ts` dibuja con vgpu (WebGPU) una cuadrícula que corre un paso por slide (`avance`, lo tuitea `Deck.tsx`), dos luces que derivan solas y un destello amarillo (`pulso`, lo dispara `<Destello en={n} />` desde una slide). Lo monta `App.tsx` una sola vez; las vistas le mueven los parámetros por `FondoCtx`. Sin WebGPU no se dibuja y queda la cuadrícula del CSS.

## Coreografía por slide

Toda slide entra con el título por palabras (`WordsIn`) o por chars (`Chars`) y los `[data-in]` subiendo detrás. Encima, cada slide puede sumar:

- `coreografia(root, tl)`: agrega a la timeline de entrada. Recetas en `src/motion/motion.tsx`: `tipear` (los `.char` de a uno), `dibujar` (un trazo SVG con `pathLength="1"`), `sacudir`.
- `<Paso n desde="izq|der|abajo|arriba|escala|clip" tipea>`: la entrada de cada paso. Hijos con `data-s` entran de a uno (con su `data-origen`), `[data-regla]` crece desde la izquierda.
- `data-step` en `.slide`: el CSS cambia estados con el paso (atenuar, pintar) con transiciones.

`?quieto` en la URL apaga toda animación (igual que `prefers-reduced-motion`): sirve para ver cada slide en su estado final y sacar capturas.

## Paleta

Tokens en `:root` de `src/styles.css`, sacados de la placa `../assets/placa-utn-1080x1350.png`: fondo `#000000`, amarillo BNB `#f0b90b`, gris `#8c8c8c` para etiquetas. Títulos en JetBrains Mono, cuerpo en Geist.
