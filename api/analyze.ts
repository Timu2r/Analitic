import { handleAnalyze } from './_handlers'

/** Vercel serverless: POST /api/analyze { title, category?, rating?, reviews?, orders? } → { analysis, source } */
export default async function handler(req: { method?: string; body?: unknown }, res: VercelRes) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {})
  const out = await handleAnalyze(body as { title: string; category?: string; rating?: number; reviews?: number; orders?: number })
  return res.status(200).json(out)
}

interface VercelRes {
  status: (code: number) => { json: (data: unknown) => void }
}
