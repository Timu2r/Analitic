import rawProducts from './uzum-real.json'
import rawWb from './wb-mock.json'
import rawYandex from './yandex-mock.json'
import { seasonFor } from '@/lib/seasonality'

export type Marketplace = 'uzum' | 'wildberries' | 'yandex'

export type Competition = 'low' | 'med' | 'high'

/** Период ранжирования «лучших товаров». 'all' — реальные заказы; остальные — ОЦЕНКА. */
export type Period = 'day' | 'week' | 'month' | 'year' | 'all'

export interface PeriodSales {
  day: number
  week: number
  month: number
  year: number
}

export interface Product {
  id: string
  /** реальный id товара на Uzum (для ссылки) */
  uzumId: number
  title: string
  category: string
  leafCategory: string
  currency: string
  /** точные данные с витрины (снимок «сейчас») */
  price: number
  rating: number
  reviews: number
  /** реальное накопленное число заказов (точно) */
  ordersTotal: number
  stock: number
  /** реальное число товаров в узкой нише (насыщенность, с Uzum) */
  leafProductAmount: number
  /** реальное число товаров в верхней категории */
  topProductAmount: number
  /** реальные данные продавца */
  sellerOrders: number
  sellerRating: number
  /** оценочные данные (выводятся, не точные) */
  estSalesPerMonth: number
  estRevenuePerMonth: number
  /** ОЦЕНКА продаж по периодам (нет реальной истории — выводится из ordersTotal) */
  periodSales: PeriodSales
  /** прокси «горячести» спроса 0–100 (из снимка, НЕ история) */
  demandProxy: number
  /** популярность/вовлечённость 0–100 — «любят» товар (отзывы/рейтинг), отдельно от объёма */
  popularity: number
  /** объём продаж 0–100 — абсолютные накопленные заказы (НЕ текущий тренд) */
  salesVolume: number
  /** оборачиваемость 0–100 — заказы относительно остатка (прокси свежести спроса) */
  turnover: number
  /** конкуренция — вычислена из насыщенности ниши */
  competition: Competition
  seller: string
  /** реальный URL изображения с images.uzum.uz */
  image: string
  /** маркетплейс товара */
  marketplace: Marketplace
}

/** Тип «как в JSON» — competition приходит строкой, новые поля могут отсутствовать в старых записях. */
type RawProduct = Omit<Product, 'competition' | 'demandProxy' | 'popularity' | 'salesVolume' | 'turnover' | 'marketplace'> & {
  competition?: string
}

// Логистика — как % от цены (зависит от веса/размера, 3% — средняя оценка).
export const MARKETPLACES: Record<Marketplace, { label: string; commission: number; logisticsPct: number }> = {
  uzum: { label: 'Uzum', commission: 0.12, logisticsPct: 0.03 },
  wildberries: { label: 'Wildberries', commission: 0.19, logisticsPct: 0.03 },
  yandex: { label: 'Яндекс Маркет', commission: 0.15, logisticsPct: 0.03 },
}

/**
 * Конкуренция из РЕАЛЬНОЙ насыщенности ниши (число товаров в узкой категории Uzum).
 * < 100 товаров — низкая, 100–800 — средняя, > 800 — высокая.
 */
function competitionFromNiche(leafProductAmount: number | null | undefined): Competition {
  const n = leafProductAmount ?? 0
  if (n > 0 && n < 100) return 'low'
  if (n <= 800) return 'med'
  return 'high'
}

/**
 * Прокси спроса 0–100 на ОДНОМ снимке (история по дням ещё не собрана).
 * Смешивает объём заказов + активность отзывов + рейтинг.
 * Честно: это не тренд во времени, а оценка активности по снимку.
 */
function demandProxyOf(ordersTotal: number, reviews: number, rating: number): number {
  const ordersScore = Math.min(1, Math.log10(1 + ordersTotal) / Math.log10(1 + 500))
  const reviewRatio = ordersTotal > 0 ? Math.min(1, reviews / ordersTotal) : 0
  const ratingScore = Math.min(1, Math.max(0, (rating - 3.5) / 1.5))
  return Math.round((0.6 * ordersScore + 0.2 * reviewRatio + 0.2 * ratingScore) * 100)
}

/**
 * ПОПУЛЯРНОСТЬ (вовлечённость) 0–100 — отдельно от объёма продаж.
 * Высокая = товар «любят»: активно оставляют отзывы и высокий рейтинг,
 * даже если продаж немного. Ловит «продают мало, но популярен».
 * reviews/orders (доля оставивших отзыв) + рейтинг.
 */
function popularityOf(ordersTotal: number, reviews: number, rating: number): number {
  const engagement = ordersTotal > 0 ? Math.min(1, reviews / ordersTotal / 0.3) : reviews > 0 ? 1 : 0 // ~30% отзывов/заказ = максимум вовлечённости
  const ratingScore = Math.min(1, Math.max(0, (rating - 3.5) / 1.5))
  return Math.round((0.6 * engagement + 0.4 * ratingScore) * 100)
}

/**
 * ОБЪЁМ ПРОДАЖ 0–100 — чисто абсолютные накопленные заказы (лог-шкала).
 * Высокий = много продано за всё время (но НЕ значит, что растёт сейчас).
 */
function salesVolumeOf(ordersTotal: number): number {
  return Math.round(Math.min(1, Math.log10(1 + ordersTotal) / Math.log10(1 + 2000)) * 100)
}

/**
 * ОБОРАЧИВАЕМОСТЬ 0–100 — заказы относительно остатка.
 * Высокая = мало на складе при больших заказах (быстро разлетается, горячий сейчас);
 * низкая = большой остаток лежит. Прокси «свежести» спроса без истории.
 */
function turnoverOf(ordersTotal: number, stock: number): number {
  if (ordersTotal === 0) return 0
  const ratio = ordersTotal / (stock + 1)
  return Math.round(Math.min(1, Math.log10(1 + ratio) / Math.log10(1 + 20)) * 100)
}

function enrich(raw: RawProduct[], marketplace: Marketplace): Product[] {
  return raw.map((p) => ({
    ...p,
    leafProductAmount: p.leafProductAmount ?? 0,
    topProductAmount: p.topProductAmount ?? 0,
    sellerOrders: p.sellerOrders ?? 0,
    sellerRating: p.sellerRating ?? 0,
    competition: competitionFromNiche(p.leafProductAmount),
    demandProxy: demandProxyOf(p.ordersTotal, p.reviews, p.rating),
    popularity: popularityOf(p.ordersTotal, p.reviews, p.rating),
    salesVolume: salesVolumeOf(p.ordersTotal),
    turnover: turnoverOf(p.ordersTotal, p.stock),
    marketplace,
  }))
}

/** Все товары всех маркетплейсов. */
export const ALL_PRODUCTS: Product[] = [
  ...enrich(rawProducts as RawProduct[], 'uzum'),
  ...enrich(rawWb as RawProduct[], 'wildberries'),
  ...enrich(rawYandex as RawProduct[], 'yandex'),
]

/** Товары конкретного маркетплейса. */
export function productsFor(marketplace: Marketplace): Product[] {
  return ALL_PRODUCTS.filter((p) => p.marketplace === marketplace)
}

/** Категории конкретного маркетплейса. */
export function categoriesFor(marketplace: Marketplace): string[] {
  return Array.from(new Set(productsFor(marketplace).map((p) => p.category)))
}

/** Back-compat: PRODUCTS/CATEGORIES = Uzum по умолчанию (для кода, не передающего маркетплейс). */
export const PRODUCTS: Product[] = productsFor('uzum')
export const CATEGORIES: string[] = categoriesFor('uzum')

/** Подписи и честность периодов. 'all' — реальные данные, остальные — оценка. */
export const PERIODS: { value: Period; label: string; exact: boolean }[] = [
  { value: 'day', label: 'День', exact: false },
  { value: 'week', label: 'Неделя', exact: false },
  { value: 'month', label: 'Месяц', exact: false },
  { value: 'year', label: 'Год', exact: false },
  { value: 'all', label: 'Всё время', exact: true },
]

/**
 * Продажи товара за период. 'all' = реальные накопленные заказы (точно).
 * Остальные периоды — ОЦЕНКА (нет истории), брать с пометкой.
 */
export function salesForPeriod(p: Product, period: Period): number {
  if (period === 'all') return p.ordersTotal
  return p.periodSales[period]
}

/** Лучшие товары за период (по продажам за этот период). */
export function bestByPeriod(period: Period, list: Product[] = PRODUCTS): Product[] {
  return [...list].sort((a, b) => salesForPeriod(b, period) - salesForPeriod(a, period))
}

/** Ссылка на реальную карточку товара на Uzum. */
export function uzumUrl(uzumId: number): string {
  return `https://uzum.uz/ru/product/${uzumId}`
}

/** Ссылка на товар/поиск на маркетплейсе (для WB/Яндекс — поиск по названию: реальных id нет). */
export function productExternal(p: Product): { url: string; label: string } {
  if (p.marketplace === 'uzum') return { url: `https://uzum.uz/ru/product/${p.uzumId}`, label: 'Открыть на Uzum' }
  if (p.marketplace === 'wildberries')
    return { url: `https://www.wildberries.ru/catalog/0/search.aspx?search=${encodeURIComponent(p.title)}`, label: 'Найти на Wildberries' }
  return { url: `https://market.yandex.ru/search?text=${encodeURIComponent(p.title)}`, label: 'Найти на Яндекс Маркете' }
}

export function getProduct(id: string): Product | undefined {
  return ALL_PRODUCTS.find((p) => p.id === id)
}

/**
 * Поправка комиссии по категории (реальные маркетплейсы берут разный % по категориям).
 * Множитель к базовой комиссии маркетплейса. Значения — реалистичная оценка.
 */
const CATEGORY_COMMISSION_FACTOR: { match: RegExp; factor: number }[] = [
  { match: /электрон|техник/i, factor: 0.8 }, // электроника — ниже
  { match: /книг/i, factor: 0.75 },
  { match: /одежд|обув/i, factor: 1.3 }, // одежда/обувь — выше
  { match: /красот|уход|парфюм/i, factor: 1.15 },
  { match: /аксессуар|ювелир/i, factor: 1.25 },
  { match: /дом|мебел/i, factor: 1.0 },
  { match: /дет/i, factor: 1.05 },
  { match: /продукт|питани/i, factor: 0.9 },
]

/** Эффективная комиссия (%) для категории на маркетплейсе. */
export function categoryCommissionPct(category: string, marketplace: Marketplace = 'uzum'): number {
  const base = MARKETPLACES[marketplace].commission
  const f = CATEGORY_COMMISSION_FACTOR.find((c) => c.match.test(category))?.factor ?? 1
  return Math.round(base * f * 1000) / 10 // в процентах, 1 знак
}

/**
 * РЕАЛЬНЫЙ расчёт маржи с учётом всех расходов:
 * 1. Цена, которую видит покупатель - это ЦЕНА с НДС (12%)
 * 2. Продавец получает: Цена / 1.12
 * 3. От суммы продавца вычитаются: комиссия, закупка, логистика
 * 
 * @param price - цена на маркетплейсе (с НДС)
 * @param costPercent - стоимость закупки как % от цены (по умолчанию 45%)
 * @param marketplace - маркетплейс
 * @param category - категория (для уточнённой комиссии)
 * @returns маржа в % от цены продавца (без НДС)
 */
export function estMarginPct(price: number, marketplace: Marketplace = 'uzum', category?: string, costPercent: number = 0.45): number {
  const mp = MARKETPLACES[marketplace]
  const commPct = category ? categoryCommissionPct(category, marketplace) / 100 : mp.commission
  
  // Цена, которую получает продавец (цена без НДС, 12% идёт государству)
  const TAX_RATE = 0.12
  const sellerPrice = price / (1 + TAX_RATE)
  
  // Расходы (считаются от реальной цены товара, не от цены маркетплейса)
  const purchaseCost = price * costPercent  // закупка от отображаемой цены
  const commissionCost = sellerPrice * commPct  // комиссия от суммы продавца
  const logisticsCost = mp.logistics
  
  // Чистая прибыль
  const profit = sellerPrice - purchaseCost - commissionCost - logisticsCost
  
  // Маржа как % от того, что получил продавец
  const marginPct = (profit / sellerPrice) * 100
  
  return Math.round(marginPct * 10) / 10
}

/** Числовой вес конкуренции для скоринга (низкая = лучше). */
const COMPETITION_WEIGHT: Record<Competition, number> = { low: 1, med: 0.55, high: 0.2 }

/** Максимум оценочной выручки в пуле — для нормализации балла. */
const MAX_REVENUE = Math.max(1, ...PRODUCTS.map((p) => p.estRevenuePerMonth))
/** Максимум оценочных продаж/мес в пуле — для нормализации «ходовости». */
const MAX_SALES_PM = Math.max(1, ...PRODUCTS.map((p) => p.estSalesPerMonth))

/** Разбивка факторов балла, каждый 0–100 (для объяснения «почему такой балл»). */
export interface ScoreBreakdown {
  /** ходовость: продажи в месяц (штуки) — главный фактор */
  sales: number
  demand: number
  competition: number
  revenue: number
  margin: number
}

/** Факторы балла (0–100 каждый) на реальных/оценочных данных. */
export function scoreBreakdown(p: Product, marketplace: Marketplace = 'uzum'): ScoreBreakdown {
  return {
    // ходовость — продажи/мес (штуки), лог-нормализация: дешёвый-ходовой ценится за объём, не за цену
    sales: Math.round((Math.log10(1 + p.estSalesPerMonth) / Math.log10(1 + MAX_SALES_PM)) * 100),
    demand: p.demandProxy, // прокси спроса из реальных заказов/отзывов (снимок)
    competition: COMPETITION_WEIGHT[p.competition] * 100, // насыщенность ниши (реальная)
    revenue: Math.round((Math.log10(1 + p.estRevenuePerMonth) / Math.log10(1 + MAX_REVENUE)) * 100),
    // маржа: 20% = 100 балла (от суммы продавца после НДС)
    margin: Math.round(Math.min(1, Math.max(0, estMarginPct(p.price, marketplace, p.category) / 20)) * 100),
  }
}

/**
 * Сезонная корректировка балла: +15 если сейчас сезон товара, −10 если он сезонный,
 * но не в сезон. Несезонные товары — 0. Делает сезонные товары топовыми в их сезон.
 */
export function seasonAdjustment(p: Product, month?: number): number {
  const s = seasonFor(p.title, p.category, month)
  if (!s) return 0
  if (s.active) return 15
  if (s.soon) return 6 // скоро сезон — лёгкий плюс (готовиться заранее)
  return -10 // сезонный товар не в сезон — спрос ниже
}

/**
 * Единый «балл потенциала» товара для продажи, 0–100.
 * 4 фактора (спрос + низкая конкуренция + выручка + маржа) + сезонная корректировка.
 */
export function potentialScore(p: Product, marketplace: Marketplace = 'uzum', month?: number): number {
  const b = scoreBreakdown(p, marketplace)
  // ХОДОВОСТЬ (продажи/мес) — главный вес. Выручка снижена (она ∝ цене, перекашивала на дорогое).
  const base =
    0.35 * (b.sales / 100) +
    0.2 * (b.demand / 100) +
    0.2 * (b.competition / 100) +
    0.1 * (b.revenue / 100) +
    0.15 * (b.margin / 100)
  const withSeason = Math.round(base * 100) + seasonAdjustment(p, month)
  return Math.max(0, Math.min(100, withSeason))
}

/** Веса факторов балла (для подписей в UI: сумма = 100%). */
export const SCORE_WEIGHTS = { sales: 35, demand: 20, competition: 20, revenue: 10, margin: 15 } as const

/* ── Аналитика ниши (категории) ────────────────────────────────────── */

export interface NicheStats {
  category: string
  productsInPool: number // товаров этой категории в нашей выборке
  nicheSize: number // реальное число товаров в нише на Uzum (макс по выборке)
  avgPrice: number
  medianOrders: number
  avgRevenue: number
  totalRevenue: number
  top3RevenueShare: number // % выручки у топ-3 (концентрация ниши)
  competition: Competition
  currency: string
}

function median(nums: number[]): number {
  if (!nums.length) return 0
  const s = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2)
}

/** Сводка по категории: средние, медиана, концентрация выручки топ-3. */
export function nicheStats(category: string, marketplace: Marketplace = 'uzum'): NicheStats | null {
  const items = productsFor(marketplace).filter((p) => p.category === category)
  if (!items.length) return null
  const revenues = items.map((p) => p.estRevenuePerMonth).sort((a, b) => b - a)
  const totalRevenue = revenues.reduce((s, r) => s + r, 0)
  const top3 = revenues.slice(0, 3).reduce((s, r) => s + r, 0)
  const nicheSize = Math.max(...items.map((p) => p.leafProductAmount || 0))
  return {
    category,
    productsInPool: items.length,
    nicheSize,
    avgPrice: Math.round(items.reduce((s, p) => s + p.price, 0) / items.length),
    medianOrders: median(items.map((p) => p.ordersTotal)),
    avgRevenue: Math.round(totalRevenue / items.length),
    totalRevenue,
    top3RevenueShare: totalRevenue > 0 ? Math.round((top3 / totalRevenue) * 100) : 0,
    competition: competitionFromNiche(nicheSize),
    currency: items[0].currency,
  }
}
