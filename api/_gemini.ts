/**
 * Общая логика обращения к Gemini. Ключ читается из env на СЕРВЕРЕ (никогда не во фронте).
 * Используется и Vite-dev-плагином (локально), и Vercel-функцией (прод).
 */

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'

export interface GeminiResult {
  ok: boolean
  text: string
  error?: string
}

/** Один вызов Gemini generateContent. Возвращает текст ответа или ошибку. */
export async function callGemini(prompt: string, opts?: { system?: string; json?: boolean }): Promise<GeminiResult> {
  const key = process.env.GEMINI_API_KEY
  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest'
  if (!key) return { ok: false, text: '', error: 'NO_KEY' }

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
  }
  if (opts?.system) body.systemInstruction = { parts: [{ text: opts.system }] }
  if (opts?.json) body.generationConfig = { responseMimeType: 'application/json' }

  try {
    const res = await fetch(`${ENDPOINT}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': key },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const errText = await res.text()
      return { ok: false, text: '', error: `Gemini ${res.status}: ${errText.slice(0, 200)}` }
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    return { ok: true, text }
  } catch (e) {
    return { ok: false, text: '', error: e instanceof Error ? e.message : 'fetch failed' }
  }
}
