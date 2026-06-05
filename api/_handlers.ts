import { callGemini } from './_gemini'

/* ── Генерация карточки ────────────────────────────────────────────── */

export interface GenerateInput {
  title: string
  category?: string
}

export interface GeneratedListing {
  titles: string[]
  description: string
  bullets: string[]
  attributes: { name: string; value: string }[]
  keywords: { term: string; demand: 'высокий' | 'средний' | 'низкий' }[]
  imagePrompts: string[]
}

const LISTING_SCHEMA_HINT = `Верни СТРОГО JSON по схеме:
{
  "titles": [3 варианта SEO-названия, строки],
  "description": "продающее описание, 2-4 предложения",
  "bullets": [4 ключевых преимущества, строки],
  "attributes": [{"name": "...", "value": "..."} — 4 характеристики],
  "keywords": [{"term": "...", "demand": "высокий|средний|низкий"} — 6-8 SEO-ключей],
  "imagePrompts": [3 промпта для генерации фото карточки]
}
Пиши на русском, для маркетплейса Uzum (Узбекистан). Только JSON, без markdown.`

export async function handleGenerate(input: GenerateInput): Promise<{ listing: GeneratedListing; source: 'ai' | 'mock' }> {
  const title = (input.title || '').trim()
  const cat = (input.category || '').trim()
  const prompt = `Товар: "${title}"${cat ? `, категория: "${cat}"` : ''}.
Собери продающую карточку товара для маркетплейса Uzum.
${LISTING_SCHEMA_HINT}`

  const res = await callGemini(prompt, { json: true })
  if (res.ok && res.text) {
    try {
      const parsed = JSON.parse(res.text) as GeneratedListing
      if (parsed.titles?.length && parsed.description) return { listing: parsed, source: 'ai' }
    } catch {
      // упадём в mock ниже
    }
  }
  return { listing: mockListing(title, cat), source: 'mock' }
}

/* ── Чат ──────────────────────────────────────────────────────────── */

export interface ChatInput {
  message: string
  /** каталог реальных товаров: id + краткие данные, из которого ИИ выбирает что показать */
  products?: { id: string; title: string; category: string; orders: number; price: number; demand: number; margin: number }[]
  /** есть ли прикреплённое фото (для тона ответа) */
  hasPhoto?: boolean
}

export interface ChatResult {
  text: string
  /** id товаров, которые ИИ выбрал показать карточками под текстом */
  productIds: string[]
  source: 'ai' | 'mock'
}

export async function handleChat(input: ChatInput): Promise<ChatResult> {
  const msg = (input.message || '').trim()
  const catalog = input.products ?? []

  const system = `Ты — НишаРадар, дружелюбный ИИ-аналитик маркетплейса Uzum для продавцов.
Тон: тёплый, живой, человечный — как полезный коллега, а не робот. На приветствия и простые вопросы отвечай приветливо и естественно (можно лёгкий эмодзи). На деловые вопросы — конкретно и по делу, на русском.
Честность данных (важно): число заказов, цена, рейтинг — точные; продажи/выручка/спрос — ОЦЕНКА; маржа — потенциал. Не выдавай оценку за факт.
Когда советуешь конкретные товары — выбирай ИХ ТОЛЬКО из переданного каталога (по id) и перечисли выбранные id в поле productIds. В самом тексте НЕ пиши технические id (типа "id: u2") — товары и так покажутся карточками под ответом, просто называй их по имени. Если вопрос не про конкретные товары (приветствие, общий вопрос) — productIds пустой.
Отвечай СТРОГО JSON: {"text": "твой ответ для продавца", "productIds": ["id1","id2",...]}. Без markdown, только JSON.`

  const catalogStr = catalog
    .map((p) => `${p.id} | ${p.title} | ${p.category} | заказов:${p.orders} | цена:${p.price} | спрос:${p.demand} | маржа:${p.margin}%`)
    .join('\n')
  const prompt = `Каталог товаров (выбирай из него по id):\n${catalogStr || '(пусто)'}\n\n${input.hasPhoto ? 'Продавец прикрепил фото товара. ' : ''}Вопрос продавца: ${msg}`

  const res = await callGemini(prompt, { system, json: true })
  if (res.ok && res.text) {
    try {
      const parsed = JSON.parse(res.text) as { text?: string; productIds?: string[] }
      if (parsed.text) {
        const valid = new Set(catalog.map((p) => p.id))
        const ids = (parsed.productIds ?? []).filter((id) => valid.has(id)).slice(0, 6)
        return { text: parsed.text, productIds: ids, source: 'ai' }
      }
    } catch {
      // не JSON — отдадим как простой текст
      return { text: res.text, productIds: [], source: 'ai' }
    }
  }
  return { text: '', productIds: [], source: 'mock' }
}

/* ── Анализ товара (качество листинга + отзывы + reverse-ключи в 1 вызов) ── */

export interface AnalyzeInput {
  title: string
  category?: string
  rating?: number
  reviews?: number
  orders?: number
}

export interface ProductAnalysis {
  listingScore: number // 0–100
  listingTips: string[] // что улучшить в названии/описании
  reviewSummary: string // о чём отзывы (на основе рейтинга/объёма — оценка)
  reviewPros: string[]
  reviewCons: string[]
  keywords: string[] // по каким ключам находят товар (reverse)
}

export async function handleAnalyze(input: AnalyzeInput): Promise<{ analysis: ProductAnalysis; source: 'ai' | 'mock' }> {
  const title = (input.title || '').trim()
  const prompt = `Проанализируй товар маркетплейса Uzum как эксперт.
Товар: "${title}"${input.category ? `, категория: ${input.category}` : ''}.
Данные: рейтинг ${input.rating ?? '?'}, отзывов ${input.reviews ?? '?'}, заказов ${input.orders ?? '?'}.
Верни СТРОГО JSON:
{
  "listingScore": число 0-100 (качество названия/листинга),
  "listingTips": [2-4 совета как улучшить название/описание],
  "reviewSummary": "1-2 предложения о чём вероятно отзывы (по рейтингу/объёму — это ОЦЕНКА, реальных текстов отзывов нет)",
  "reviewPros": [2-3 вероятных плюса],
  "reviewCons": [1-2 вероятных минуса/риска],
  "keywords": [5-7 поисковых ключей, по которым находят такой товар]
}
На русском. Только JSON.`

  const res = await callGemini(prompt, { json: true })
  if (res.ok && res.text) {
    try {
      const parsed = JSON.parse(res.text) as ProductAnalysis
      if (typeof parsed.listingScore === 'number') return { analysis: parsed, source: 'ai' }
    } catch {
      // fallthrough to mock
    }
  }
  return { analysis: mockAnalysis(title, input), source: 'mock' }
}

function mockAnalysis(title: string, input: AnalyzeInput): ProductAnalysis {
  const core = title.split(/[,(]/)[0].trim() || 'товар'
  const len = title.length
  // эвристика качества: длина названия 30-70 символов = хорошо
  const score = Math.max(20, Math.min(95, 60 + (len >= 30 && len <= 70 ? 25 : -10) + (input.rating && input.rating >= 4.5 ? 10 : 0)))
  return {
    listingScore: score,
    listingTips: [
      len < 30 ? 'Название слишком короткое — добавьте ключевые характеристики' : 'Сократите название до сути, вынесите ключи вперёд',
      'Добавьте в название бренд и главное преимущество',
      'Используйте популярные поисковые слова из ниши',
    ],
    reviewSummary: `Оценка по рейтингу ${input.rating ?? '—'} и ${input.reviews ?? 0} отзывам: товар воспринимается ${(input.rating ?? 0) >= 4.5 ? 'позитивно' : 'смешанно'}. Реальных текстов отзывов нет — это оценка.`,
    reviewPros: ['Соответствие описанию', 'Цена/качество'],
    reviewCons: ['Возможны вопросы к упаковке/доставке'],
    keywords: [`${core.toLowerCase()} купить`, `${core.toLowerCase()} цена`, `${core.toLowerCase()} оригинал`, `${core.toLowerCase()} отзывы`, `${core.toLowerCase()} узбекистан`],
  }
}

/* ── Mock fallback для генерации (когда нет ключа/сети) ─────────────── */

function mockListing(title: string, cat: string): GeneratedListing {
  const core = title.split(/[,(]/)[0].trim() || 'Товар'
  const c = cat || 'Товары'
  return {
    titles: [
      `${core} — купить оригинал, Узбекистан`,
      `${core}: качество и быстрая доставка | гарантия`,
      `${core} — выгодно, доставка по Узбекистану`,
    ],
    description: `${core} — отличное решение в категории «${c}». Сочетает качество и надёжность, подходит для себя и в подарок. Закажите с быстрой доставкой по Узбекистану.`,
    bullets: [
      'Качество, проверенное покупателями',
      'Быстрая доставка по Узбекистану',
      'Товар в наличии',
      'Идеально как для себя, так и в подарок',
    ],
    attributes: [
      { name: 'Категория', value: c },
      { name: 'Состояние', value: 'Новый' },
      { name: 'Доставка', value: 'По Узбекистану' },
      { name: 'Гарантия', value: 'Да' },
    ],
    keywords: [
      { term: `${core.toLowerCase()} купить`, demand: 'высокий' },
      { term: `${core.toLowerCase()} оригинал`, demand: 'средний' },
      { term: `${core.toLowerCase()} цена`, demand: 'высокий' },
      { term: `${core.toLowerCase()} доставка`, demand: 'средний' },
      { term: `${core.toLowerCase()} недорого`, demand: 'низкий' },
      { term: `${core.toLowerCase()} отзывы`, demand: 'средний' },
    ],
    imagePrompts: [
      `Главное фото: ${core} на белом фоне, студийный свет`,
      `Инфографика: ${core} с ключевыми преимуществами`,
      `Lifestyle: ${core} в использовании`,
    ],
  }
}
