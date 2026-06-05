import {
  productsFor,
  categoriesFor,
  estMarginPct,
  potentialScore,
  type Marketplace,
  type Period,
  type Product,
} from '@/lib/mockData'
import { SEASONS, monthName, type Season } from '@/lib/seasonality'

/** Распознать сезонный/праздничный вопрос → вернуть подходящий сезон. */
function detectSeasonQuery(q: string): Season | null {
  // явные триггеры сезонности в вопросе
  const isSeasonal =
    /сезон|к 1 сентября|1 сентября|к школе|школьн|зим|лет|весн|осен|нов.{0,3}год|нг\b|8 март|14 феврал|23 феврал|праздник|подарок к/i.test(
      q,
    )
  if (!isSeasonal) return null
  // ищем сезон, чьи ключи или повод упомянуты в вопросе
  return (
    SEASONS.find((s) => s.match.test(q)) ||
    SEASONS.find((s) => {
      if (/1 сентября|школ/i.test(q)) return /канцеляр/i.test(s.match.source)
      if (/зим|холод/i.test(q)) return /куртк/i.test(s.match.source)
      if (/лет|жар|пляж/i.test(q)) return /плавк/i.test(s.match.source)
      if (/нов.{0,3}год|нг\b/i.test(q)) return /подар|ёлк/i.test(s.match.source)
      if (/8 март|14 феврал/i.test(q)) return /косметик/i.test(s.match.source)
      if (/23 феврал/i.test(q)) return /бритв/i.test(s.match.source)
      return false
    }) ||
    null
  )
}

function seasonHint(occasion: string): string {
  if (/сентябр|школ/i.test(occasion)) return 'канцелярия, рюкзаки, школьная одежда'
  if (/зим|холод/i.test(occasion)) return 'тёплая одежда, обогреватели, термобельё'
  if (/лет|жар/i.test(occasion)) return 'плавки/купальники, вентиляторы, солнцезащита'
  if (/новый год/i.test(occasion)) return 'подарки, игрушки, новогодний декор'
  if (/8 март|14 феврал/i.test(occasion)) return 'косметика, парфюм, украшения'
  return 'сезонные товары под этот повод'
}

export interface CategoryHit {
  category: string
  detail: string // короткая метрика для кнопки
}

export interface ChatAnswer {
  text: string
  products?: Product[]
  /** категории-кнопки (для вопросов «на какие категории...») */
  categories?: CategoryHit[]
  /** false → движок не понял вопрос (фронт передаёт его в Gemini). */
  matched: boolean
}

/* ── Разбор вопроса: категория + период + критерий ─────────────────── */

type Criterion = 'best' | 'revenue' | 'margin' | 'demand' | 'orders' | 'lowComp'

/**
 * Найти упомянутую категорию. Сначала точные/синонимичные фразы (порядок важен:
 * специфичные раньше общих, чтобы «бытовая техника» не путалась с «бытовая химия»),
 * затем — полное вхождение названия категории целиком.
 */
function detectCategory(q: string, categories: string[]): string | null {
  // Синонимы → точное имя категории. Порядок: специфичное раньше общего.
  const SYN: { match: RegExp; cat: string }[] = [
    { match: /быт.{0,6}техник|техник для дома|крупн.{0,4}техник/i, cat: 'Бытовая техника' },
    { match: /быт.{0,6}хими|чистящ|моющ|порошок/i, cat: 'Бытовая химия' },
    { match: /электрон|гаджет|смартфон|телефон|наушник|ноутбук/i, cat: 'Электроника' },
    { match: /косметик|красот|уход за|парфюм|макияж|ресниц/i, cat: 'Красота и уход' },
    { match: /одежд|футбол|куртк|плать|джинс/i, cat: 'Одежда' },
    { match: /обув|кроссовк|ботин|туфл/i, cat: 'Обувь' },
    { match: /книг|литератур|роман/i, cat: 'Книги' },
    { match: /автотовар|для авто|машин|автомобил/i, cat: 'Автотовары' },
    { match: /мебел/i, cat: 'Мебель' },
    { match: /товар.{0,4}для дома|для дома|интерьер|декор/i, cat: 'Товары для дома' },
    { match: /\bдет(ск|ям|ей|и)|игрушк|ребёнк|ребенк|для детей/i, cat: 'Детские товары' },
    { match: /спорт|фитнес|тренаж/i, cat: 'Спорт и отдых' },
    { match: /здоров|аптек|витамин/i, cat: 'Здоровье' },
    { match: /канцеляр|канцтовар|тетрад|ручк/i, cat: 'Канцтовары' },
    { match: /аксессуар/i, cat: 'Аксессуары' },
    { match: /продукт|питани|еда|снек/i, cat: 'Продукты питания' },
    { match: /строит|ремонт|инструмент/i, cat: 'Строительство и ремонт' },
    { match: /дач|сад|огород/i, cat: 'Дача, сад и огород' },
    { match: /хобби|творчеств|рукодел/i, cat: 'Хобби и творчество' },
  ]
  for (const s of SYN) {
    if (s.match.test(q) && categories.includes(s.cat)) return s.cat
  }
  // Полное вхождение названия категории целиком (на случай точной формулировки).
  for (const c of categories) {
    if (q.includes(c.toLowerCase())) return c
  }
  return null
}

/** Период из вопроса (для будущего, влияет на формулировку; данные — снимок). */
function detectPeriod(q: string): Period | null {
  if (/год|годов|ежегод|в этом году/i.test(q)) return 'year'
  if (/месяц|за мес/i.test(q)) return 'month'
  if (/недел/i.test(q)) return 'week'
  if (/сегодн|день|сейчас/i.test(q)) return 'day'
  if (/всё врем|все врем|за всё|за все/i.test(q)) return 'all'
  return null
}

/** Критерий ранжирования. */
function detectCriterion(q: string): Criterion {
  if (/марж|прибыл|выгодн|окупа|рентабельн/i.test(q)) return 'margin'
  if (/выручк|оборот/i.test(q)) return 'revenue'
  if (/тренд|растущ|растёт|растет|популярн|хит|в тренде|спрос/i.test(q)) return 'demand'
  if (/заказ|продаж|покупа|ходов/i.test(q)) return 'orders'
  if (/конкурен|свободн|незанят/i.test(q)) return 'lowComp'
  return 'best' // «лучший / самый / топ / что продавать» → общий балл
}

/** Доп. модификаторы из вопроса (цена, объём продаж). */
interface Modifiers {
  cheap: boolean // «дешёвый», «недорогой», «бюджетный»
  expensive: boolean // «дорогой», «премиум»
  bulk: boolean // «в больших количествах», «оптом», «много продаж»
}

function detectModifiers(q: string): Modifiers {
  return {
    cheap: /дешёв|дешев|недорог|бюджет|доступн.{0,4}цен|низк.{0,4}цен/i.test(q),
    expensive: /дорог|премиум|элитн|высок.{0,4}цен/i.test(q),
    bulk: /больш.{0,4}колич|оптом|опт\b|массов|много прода|объ[её]м/i.test(q),
  }
}

const PERIOD_WORD: Record<Period, string> = {
  day: 'за сегодня',
  week: 'за неделю',
  month: 'за месяц',
  year: 'в этом году',
  all: 'за всё время',
}

/** Спрашивают ли про КАТЕГОРИИ/ниши в целом (а не про конкретные товары). */
function isCategoryQuestion(q: string, categories: string[]): boolean {
  return /категори|ниш|направлени|сегмент|что продавать вообще/i.test(q) && !detectCategory(q, categories)
}

/** Агрегат по категории для ответа на «какие категории...». */
function categoryRanking(crit: Criterion, mp: Marketplace) {
  const byCat = new Map<string, Product[]>()
  for (const p of productsFor(mp)) {
    if (!byCat.has(p.category)) byCat.set(p.category, [])
    byCat.get(p.category)!.push(p)
  }
  const rows = [...byCat.entries()].map(([cat, items]) => {
    const orders = items.reduce((s, p) => s + p.ordersTotal, 0)
    const avgDemand = items.reduce((s, p) => s + p.demandProxy, 0) / items.length
    const avgMargin = items.reduce((s, p) => s + estMarginPct(p.price, mp, cat), 0) / items.length
    const revenue = items.reduce((s, p) => s + p.estRevenuePerMonth, 0)
    const lowCompShare = items.filter((p) => p.competition === 'low').length / items.length
    return { cat, count: items.length, orders, avgDemand, avgMargin, revenue, lowCompShare }
  })
  const key =
    crit === 'margin'
      ? (r: (typeof rows)[number]) => r.avgMargin
      : crit === 'orders' || crit === 'revenue'
        ? (r: (typeof rows)[number]) => r.orders
        : crit === 'lowComp'
          ? (r: (typeof rows)[number]) => r.lowCompShare
          : (r: (typeof rows)[number]) => r.avgDemand // demand / best
  return rows.sort((a, b) => key(b) - key(a)).slice(0, 5)
}

function rank(pool: Product[], crit: Criterion, mp: Marketplace): Product[] {
  const list = crit === 'orders' ? [...pool] : pool.filter((p) => p.ordersTotal > 0)
  const sorted = [...list].sort((a, b) => {
    switch (crit) {
      case 'revenue':
        return b.estRevenuePerMonth - a.estRevenuePerMonth
      case 'margin':
        return estMarginPct(b.price, mp, b.category) - estMarginPct(a.price, mp, a.category)
      case 'demand':
        return b.demandProxy - a.demandProxy
      case 'orders':
        return b.ordersTotal - a.ordersTotal
      case 'lowComp': {
        const rankComp = (p: Product) => (p.competition === 'low' ? 2 : p.competition === 'med' ? 1 : 0)
        return rankComp(b) - rankComp(a) || b.estRevenuePerMonth - a.estRevenuePerMonth
      }
      default:
        return potentialScore(b, mp) - potentialScore(a, mp)
    }
  })
  return sorted.slice(0, 4)
}

/**
 * Разбирает вопрос (категория + период + критерий) и отвечает из РЕАЛЬНЫХ данных.
 * Без ИИ. Если не удалось понять — matched:false (фронт передаст вопрос Gemini).
 */
export function answer(input: string, mp: Marketplace, mpLabel: string): ChatAnswer {
  const q = input.toLowerCase().trim()

  // приветствия / болтовня — пусть отвечает ИИ (живее)
  if (/^(привет|здаров|hi|hello|хай|добрый|здравств)/i.test(q) || q.length < 3) {
    return { text: '', matched: false }
  }

  const pool0 = productsFor(mp)
  const categories = categoriesFor(mp)
  const category = detectCategory(q, categories)
  const period = detectPeriod(q)
  const criterion = detectCriterion(q)
  const mods = detectModifiers(q)

  // ── Сезонный/праздничный вопрос («что продавать к 1 сентября / зимой / к НГ») ──
  const seasonHit = detectSeasonQuery(q)
  if (seasonHit) {
    const matchedProducts = pool0.filter((p) => seasonHit.match.test(`${p.title} ${p.category}`.toLowerCase()))
    const ranked = rank(matchedProducts.length ? matchedProducts : pool0, 'best', mp)
    if (matchedProducts.length) {
      return {
        text:
          `Под сезон «${seasonHit.occasion}» (пик в ${seasonHit.months.map(monthName).join(', ')}) ` +
          `в нашей выборке стоит брать: ${ranked.map((p) => `«${shortTitle(p.title)}»`).join(', ')}. ` +
          `Готовьте товар заранее — закупка и карточка должны быть готовы к началу сезона. ` +
          `Это календарь-подсказка по типу товара, а не прогноз из истории продаж.`,
        products: ranked,
        matched: true,
      }
    }
    return {
      text:
        `Сезон «${seasonHit.occasion}» — пик в ${seasonHit.months.map(monthName).join(', ')}. ` +
        `В текущей выборке подходящих сезонных товаров мало. Обычно в этот сезон заходят: ${seasonHint(seasonHit.occasion)}.`,
      matched: true,
    }
  }

  // ── Вопрос про КАТЕГОРИИ в целом («на какие категории высокий спрос») ──
  if (isCategoryQuestion(q, categories)) {
    const ranked = categoryRanking(criterion, mp)
    const critWord =
      criterion === 'margin'
        ? 'по средней марже'
        : criterion === 'orders' || criterion === 'revenue'
          ? 'по объёму продаж'
          : criterion === 'lowComp'
            ? 'по доле товаров с низкой конкуренцией'
            : 'по спросу'
    const categories: CategoryHit[] = ranked.map((r) => ({
      category: r.cat,
      detail:
        criterion === 'margin'
          ? `ср. маржа ~${r.avgMargin.toFixed(0)}%`
          : criterion === 'lowComp'
            ? `${Math.round(r.lowCompShare * 100)}% низкой конкуренции`
            : `${fmtShort(r.orders)} заказов · спрос ${r.avgDemand.toFixed(0)}/100`,
    }))
    const top = ranked[0]
    return {
      text:
        `Топ категорий ${critWord} (по выборке ${mpLabel}). Сейчас впереди «${top.cat}» — нажмите на категорию, чтобы открыть её товары. ` +
        `Заказы — точные, спрос/выручка — оценка.`,
      categories,
      matched: true,
    }
  }

  const productishSignal =
    category ||
    mods.cheap ||
    mods.expensive ||
    mods.bulk ||
    /лучш|самый|топ|маржа|выручк|тренд|заказ|продаж|конкурен|выгодн|популярн|стоит продавать|что продавать|ниш/i.test(q)
  if (!productishSignal) {
    return { text: '', matched: false } // не поняли → ИИ
  }

  // База: категория.
  let pool = category ? pool0.filter((p) => p.category === category) : pool0

  // Модификатор цены: дешёвый = нижняя половина по цене в пуле; дорогой = верхняя.
  const filterNotes: string[] = []
  if (mods.cheap || mods.expensive) {
    const prices = pool.map((p) => p.price).sort((a, b) => a - b)
    const median = prices[Math.floor(prices.length / 2)] ?? 0
    if (mods.cheap) {
      pool = pool.filter((p) => p.price <= median)
      filterNotes.push(`дешевле ${fmtShort(median)} ${pool[0]?.currency ?? 'сум'}`)
    } else {
      pool = pool.filter((p) => p.price >= median)
      filterNotes.push(`дороже ${fmtShort(median)} ${pool[0]?.currency ?? 'сум'}`)
    }
  }

  // Модификатор объёма: для «больших количеств» отбираем высокий спрос/заказы.
  if (mods.bulk) {
    pool = pool.filter((p) => p.ordersTotal >= 50)
    filterNotes.push('с высоким объёмом продаж')
  }

  // Критерий: при «дешёвый + большие количества + выгодный» комбинируем —
  // если упомянута маржа/выгода, ранжируем по марже, иначе по баллу.
  const effectiveCrit: Criterion = mods.bulk && criterion === 'best' ? 'orders' : criterion
  const products = rank(pool, effectiveCrit, mp)

  if (!products.length) {
    const filt = filterNotes.length ? ` (${filterNotes.join(', ')})` : ''
    return {
      text: `Под такие условия${filt}${category ? ` в категории «${category}»` : ''} подходящих товаров в выборке не нашлось. Попробуйте смягчить условия — например, без ограничения цены.`,
      matched: true,
    }
  }

  const where = category ? `в категории «${category}»` : 'по всем категориям'
  const when = period ? ` ${PERIOD_WORD[period]}` : ''
  const filt = filterNotes.length ? ` (${filterNotes.join(', ')})` : ''

  // ── Живое объяснение: вступление + разбор каждого товара + что не стоит ──
  const top = products[0]

  const intro =
    `Под ваш запрос${filt} ${where}${when} вот что стоит брать. ` +
    `Лучший кандидат — «${shortTitle(top.title)}»: ` +
    explainProduct(top, mp) +
    '.'

  // разбор 2-3 следующих
  const others = products.slice(1, 4)
  const othersText = others.length
    ? ' Также присмотритесь: ' +
      others.map((p) => `«${shortTitle(p.title)}» (${explainProductShort(p, mp)})`).join('; ') +
      '.'
    : ''

  // что НЕ стоит — слабый товар из пула (низкий балл)
  const weak = [...pool].sort((a, b) => potentialScore(a, mp) - potentialScore(b, mp))[0]
  const avoid =
    weak && weak.id !== top.id && potentialScore(weak, mp) < 45
      ? ` А вот «${shortTitle(weak.title)}» брать осторожно — низкий балл (${potentialScore(weak, mp)}): ${weakReason(weak, mp)}.`
      : ''

  const honesty =
    ` Цена, рейтинг и число заказов — точные с витрины; продажи и маржа (по тарифам ${mpLabel}, закупка ~45% цены) — оценка, не гарантия.` +
    (period === 'year' ? ' Прогноза «на год» пока нет — это лучшие на сейчас.' : '')

  return {
    text: intro + othersText + avoid + honesty,
    products,
    matched: true,
  }
}

/* ── Хелперы для живого объяснения ─────────────────────────────────── */

function fmtShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')} млн`
  if (n >= 1_000) return `${Math.round(n / 1000)} тыс`
  return String(n)
}

function shortTitle(t: string): string {
  const cut = t.split(/[,(]/)[0].trim()
  return cut.length > 38 ? cut.slice(0, 38) + '…' : cut
}

function explainProduct(p: Product, mp: Marketplace): string {
  const m = estMarginPct(p.price, mp, p.category)
  const parts = [
    `цена ${fmtShort(p.price)} ${p.currency}`,
    `${p.ordersTotal} реальных заказов`,
    `маржа ~${m}%`,
    `балл ${potentialScore(p, mp)}/100`,
  ]
  const comp = p.competition === 'low' ? 'низкая конкуренция — легче зайти' : p.competition === 'high' ? 'высокая конкуренция — нужен бюджет на старт' : 'средняя конкуренция'
  return `${parts.join(', ')}; ${comp}`
}

function explainProductShort(p: Product, mp: Marketplace): string {
  return `${fmtShort(p.price)} ${p.currency}, ${p.ordersTotal} заказов, маржа ~${estMarginPct(p.price, mp, p.category)}%`
}

function weakReason(p: Product, mp: Marketplace): string {
  const m = estMarginPct(p.price, mp, p.category)
  if (p.competition === 'high') return 'перегретая ниша'
  if (m < 15) return `тонкая маржа ~${m}%`
  if (p.ordersTotal < 30) return 'мало продаж'
  return 'слабые метрики в совокупности'
}
