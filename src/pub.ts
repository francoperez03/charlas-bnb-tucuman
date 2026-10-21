// Ruta a un archivo de public/. Respeta el `base` de Vite: '/' en Vercel, '/charlas-superteam-tucuman/' en GitHub Pages.
export const pub = (p: string) => import.meta.env.BASE_URL + p.replace(/^\//, '')
