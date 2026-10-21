import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Puerto fijo, vecino del sitio de charlas de Superteam (5181).
// VITE_BASE lo pone el workflow de GitHub Pages; en Vercel y local queda '/'.
export default defineConfig({ base: process.env.VITE_BASE ?? '/', plugins: [react()], server: { port: 5182, strictPort: true } })
