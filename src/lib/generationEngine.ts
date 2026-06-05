
/**
 * Мок-движок генерации карточек товара.
 * Детерминированно строит правдоподобный листинг (название, описание, буллеты,
 * характеристики, SEO-ключи) из реального товара. БЕЗ реального LLM — это заготовка
 * под Claude API на этапе реализации. Помечать результат как «черновик ИИ».
 */

export interface GeneratedListing {
  titles: string[] // варианты SEO-названия
  description: string
  bullets: string[]
  attributes: { name: string; value: string }[]
  keywords: { term: string; demand: 'высокий' | 'средний' | 'низкий' }[]
  imagePrompts: string[] // тексты-промпты под генерацию фото (мок)
}

// Пулы ключевых слов по категориям — имитируют подбор по поисковому спросу (Wordstat).
const KEYWORDS_BY_CATEGORY: Record<string, string[]> = {
  Электроника: ['купить', 'оригинал', 'гарантия', 'быстрая доставка', 'мощный', 'емкий аккумулятор', 'на подарок'],
  'Детские товары': ['для детей', 'безопасный', 'мягкий', 'развивающий', 'подарок ребёнку', 'от 3 лет', 'гипоаллергенный'],
  Автотовары: ['для авто', 'набор', 'универсальный', 'прочный', 'в машину', 'автоаксессуары', 'качественный'],
  'Красота и уход': ['стойкий', 'водостойкий', 'для макияжа', 'профессиональный', 'натуральный', 'без вреда', 'тренд 2026'],
  Одежда: ['женский', 'мужской', 'стильный', 'на каждый день', 'комплект', 'модный', 'удобный'],
  'Туризм, рыбалка и охота': ['походный', 'компактный', 'для туризма', 'надёжный', 'портативный', 'на природу', 'лёгкий'],
  'Бытовая химия': ['эффективный', 'концентрат', 'без запаха', 'для дома', 'экономичный', 'мощное средство', 'безопасный'],
  'Товары для дома': ['для дома', 'декор', 'оригинальный', 'на подарок', 'интерьер', 'уютный', 'практичный'],
  Книги: ['книга', 'для детей', 'в подарок', 'бестселлер', 'твёрдый переплёт', 'иллюстрации', 'развивающая'],
  'Хобби и творчество': ['набор для творчества', 'развивающий', 'хобби', 'на подарок', 'для всей семьи', 'антистресс', 'увлекательный'],
  'Продукты питания': ['вкусный', 'натуральный', 'без консервантов', 'на перекус', 'полезный', 'импортный', 'премиум'],
}

const GENERIC_KEYWORDS = ['купить', 'недорого', 'с доставкой', 'качественный', 'оригинал', 'хит продаж', 'выгодно']

function seedFrom(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

/** Короткое «ядро» названия товара (без длинных хвостов характеристик). */
function coreName(title: string): string {
  const cut = title.split(/[,(]/)[0].trim()
  return cut.length > 4 ? cut : title
}

/** Стили карточки товара. */
export type CardStyle = 'minimal' | 'vivid' | 'premium' | 'lifestyle' | 'infographic'

export const CARD_STYLES: { value: CardStyle; label: string; desc: string }[] = [
  { value: 'minimal', label: 'Минимализм', desc: 'Чистый белый фон, акцент на товаре' },
  { value: 'vivid', label: 'Яркий', desc: 'Сочные цвета, контраст, привлекает взгляд' },
  { value: 'premium', label: 'Премиум', desc: 'Тёмный фон, мягкий свет, дорогой вид' },
  { value: 'lifestyle', label: 'Lifestyle', desc: 'Товар в реальной обстановке использования' },
  { value: 'infographic', label: 'Инфографика', desc: 'Выноски с преимуществами и характеристиками' },
]

/**
 * Профессиональные промпты под генерацию изображений карточки (для image-ИИ).
 * Промпт на английском (image-модели лучше понимают), детальный: композиция/свет/фон.
 * Учитывает выбранный стиль и пользовательское описание фона.
 */
export function buildImagePrompts(productName: string, style: CardStyle, bgDescription?: string): string[] {
  const subject = `product photo of "${productName}"`
  const bg = bgDescription && bgDescription.trim() ? ` Custom background: ${bgDescription.trim()}.` : ''
  const common = 'e-commerce marketplace listing, ultra sharp, high resolution, professional commercial photography, no text, no watermark'

  const byStyle: Record<CardStyle, string[]> = {
    minimal: [
      `Hero ${subject}, centered on a clean pure-white seamless background, soft even studio softbox lighting, subtle natural shadow under the product, slight reflection, ${common}.${bg}`,
      `Three-quarter angle ${subject} on white background, crisp edges, balanced negative space for marketplace card, ${common}.${bg}`,
      `Detail close-up of "${productName}" texture and material on white, macro clarity, ${common}.${bg}`,
    ],
    vivid: [
      `Bold ${subject} on a vibrant saturated gradient background (brand accent colors), high contrast, punchy dynamic studio lighting, eye-catching, ${common}.${bg}`,
      `${subject} with colorful geometric shapes behind it, energetic composition, glossy highlights, ${common}.${bg}`,
      `Floating "${productName}" with dynamic color splash background, vivid and modern, ${common}.${bg}`,
    ],
    premium: [
      `Luxury ${subject} on a dark moody background, dramatic soft rim lighting, elegant reflection, cinematic depth, premium feel, ${common}.${bg}`,
      `${subject} on dark marble or matte black surface, gold/soft warm accent light, high-end product shot, ${common}.${bg}`,
      `Elegant close-up of "${productName}" with shallow depth of field on dark backdrop, ${common}.${bg}`,
    ],
    lifestyle: [
      `Lifestyle scene: "${productName}" in a real natural setting being used, soft daylight, cozy realistic environment, shallow depth of field, ${common}.${bg}`,
      `"${productName}" placed in a stylish modern interior context, ambient warm light, lived-in atmosphere, ${common}.${bg}`,
      `Human hands interacting with "${productName}" in everyday use, authentic candid feel, ${common}.${bg}`,
    ],
    infographic: [
      `Infographic marketplace card for "${productName}" on clean background with 3-4 callout labels pointing to key features, icons, modern flat design layout, ${common}.${bg}`,
      `"${productName}" with feature highlight badges and benefit annotations arranged around it, structured grid, ${common}.${bg}`,
      `Comparison/benefits infographic of "${productName}", clean sections, iconography, ${common}.${bg}`,
    ],
  }
  return byStyle[style]
}

/**
 * Генерация карточки из ввода селлера: название своего товара + (необязательно) категория.
 * Это основной путь — селлер генерит карточку для СВОЕГО товара, которого ещё нет на витрине.
 */
export function generateFromInput(
  title: string,
  category?: string,
  style: CardStyle = 'minimal',
  bgDescription?: string,
): GeneratedListing {
  const core = coreName(title)
  const cat = category && category.trim() ? category : 'Товары'
  const seed = seedFrom(title)

  const pool = KEYWORDS_BY_CATEGORY[cat] ?? GENERIC_KEYWORDS
  const picked = pool.slice(0, 5)

  const titles = [
    `${core} — ${picked[0]} ${picked[1]}, Узбекистан`.replace(/\s+/g, ' ').trim(),
    `${core}: ${picked[2]}, ${picked[3]} | оригинал с гарантией`,
    `${core} ${picked[1]} — ${picked[4] ?? picked[0]}, доставка по Узбекистану`,
  ]

  const bullets = [
    `${picked[1].charAt(0).toUpperCase() + picked[1].slice(1)} — подойдёт для ежедневного использования`,
    `${picked[0].charAt(0).toUpperCase() + picked[0].slice(1)} — качество, проверенное покупателями`,
    `Быстрая доставка по Узбекистану — товар в наличии`,
    `Идеально как для себя, так и в подарок`,
  ]

  const description =
    `${core} — это ${picked[1]} решение в категории «${cat}». ` +
    `Товар сочетает ${picked[0]} и ${picked[3] ?? 'надёжность'}, подходит как для себя, так и в подарок. ` +
    `Закажите с быстрой доставкой по Узбекистану — количество ограничено.`

  const attributes = [
    { name: 'Категория', value: cat },
    { name: 'Состояние', value: 'Новый' },
    { name: 'Доставка', value: 'По Узбекистану' },
    { name: 'Гарантия', value: 'Да' },
  ]

  const allTerms = [...picked, ...GENERIC_KEYWORDS].slice(0, 8)
  const keywords = allTerms.map((term, i) => ({
    term: `${core.toLowerCase().split(' ')[0]} ${term}`.trim(),
    demand: ((seed + i) % 3 === 0 ? 'высокий' : (seed + i) % 3 === 1 ? 'средний' : 'низкий') as
      | 'высокий'
      | 'средний'
      | 'низкий',
  }))

  const imagePrompts = buildImagePrompts(core, style, bgDescription)

  return { titles, description, bullets, attributes, keywords, imagePrompts }
}

