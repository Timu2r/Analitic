import type { GeneratedListing } from '@/lib/generationEngine'

/** Клиент к нашему /api прокси (ключ Gemini живёт на сервере, не во фронте). */

export async function aiGenerateListing(
  title: string,
  category?: string,
): Promise<{ listing: GeneratedListing; source: 'ai' | 'mock' }> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, category }),
  })
  if (!res.ok) throw new Error(`generate ${res.status}`)
  return res.json()
}

export interface ProductAnalysis {
  listingScore: number
  listingTips: string[]
  reviewSummary: string
  reviewPros: string[]
  reviewCons: string[]
  keywords: string[]
}

export async function aiAnalyzeProduct(input: {
  title: string
  category?: string
  rating?: number
  reviews?: number
  orders?: number
}): Promise<{ analysis: ProductAnalysis; source: 'ai' | 'mock' }> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`analyze ${res.status}`)
  return res.json()
}

export interface ChatProduct {
  id: string
  title: string
  category: string
  orders: number
  price: number
  demand: number
  margin: number
}

export async function aiChat(
  message: string,
  products: ChatProduct[],
  hasPhoto?: boolean,
): Promise<{ text: string; productIds: string[]; source: 'ai' | 'mock' }> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, products, hasPhoto }),
  })
  if (!res.ok) throw new Error(`chat ${res.status}`)
  return res.json()
}
