import { pub } from '../pub'
// Quiénes dan la noche: foto, red y QR de cada uno, para la slide de presentación del equipo.
// Las fotos y los QR viven en public/img/. `qr` es la red a la que apunta el QR; sin `qr`, la slide final muestra solo la foto.
// ponytail: los QR son SVG estáticos; si cambia un link, regenerarlo con la librería qrcode (ver qr-sitio.svg en README).
export type Persona = { nombre: string; rol?: string; foto: string; qr?: { red: string; usuario: string; img: string } }

export const EQUIPO: Persona[] = [
  { nombre: 'Franco Pérez', rol: 'Founder · Crisol', foto: pub('/img/franco-mic.jpg'), qr: { red: 'Instagram', usuario: 'franco.perez03', img: pub('/img/qr-franco.svg') } },
  { nombre: 'Alejandro Colchi', rol: 'Future Software Engineer', foto: pub('/img/foto_alejo.jpeg'), qr: { red: 'X', usuario: 'alejow_dev', img: pub('/img/qr-alejo.svg') } },
  { nombre: 'Ignacio Mohamed', rol: 'Data Scientist', foto: pub('/img/foto_mohamed.jpg'), qr: { red: 'LinkedIn', usuario: 'sergio-ignacio-mohamed', img: pub('/img/qr-mohamed.svg') } },
]
