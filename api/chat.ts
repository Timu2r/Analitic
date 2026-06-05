import { handleChat } from './_handlers'

/** Vercel serverless: POST /api/chat { message, context? } → { text, source } */
export default async function handler(req: { method?: string; body?: unknown }, res: VercelRes) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {})
  const out = await handleChat(body as { message: string; context?: string })
  return res.status(200).json(out)
}

interface VercelRes {
  status: (code: number) => { json: (data: unknown) => void }
}
