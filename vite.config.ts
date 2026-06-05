import path from 'path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Dev-плагин: поднимает /api/generate и /api/chat локально под `vite dev`
 * (на Vercel те же хендлеры работают как serverless-функции из папки /api).
 * Ключ Gemini читается из .env.local на сервере — во фронт не попадает.
 */
function apiDevPlugin(env: Record<string, string>): Plugin {
  // прокидываем env в process.env, чтобы _gemini.ts его увидел
  process.env.GEMINI_API_KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''
  process.env.GEMINI_MODEL = env.GEMINI_MODEL || process.env.GEMINI_MODEL || ''
  return {
    name: 'api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end(JSON.stringify({ error: 'POST only' }))
        }
        let raw = ''
        req.on('data', (c) => (raw += c))
        req.on('end', async () => {
          try {
            const body = raw ? JSON.parse(raw) : {}
            const { handleGenerate, handleChat, handleAnalyze } = await server.ssrLoadModule('/api/_handlers.ts')
            const out = req.url?.startsWith('/api/generate')
              ? await handleGenerate(body)
              : req.url?.startsWith('/api/analyze')
                ? await handleAnalyze(body)
                : await handleChat(body)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(out))
          } catch (e) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: e instanceof Error ? e.message : 'error' }))
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), apiDevPlugin(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
