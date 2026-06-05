import { handleGenerate } from './_handlers'

/** Vercel serverless: POST /api/generate { title, category? } → { listing, source } */
export default async function handler(req: { method?: string; body?: unknown }, res: VercelRes) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {})
  const out = await handleGenerate(body as { title: string; category?: string })
  return res.status(200).json(out)
}

interface VercelRes {
  status: (code: number) => { json: (data: unknown) => void }
}
