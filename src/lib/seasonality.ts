/**
 * Календарь сезонности — экспертная привязка категорий/товаров к месяцам пикового спроса.
 * ЧЕСТНО: это не прогноз из истории продаж (её нет), а календарь-подсказка по типу товара.
 * Месяцы: 1=январь … 12=декабрь.
 */

export interface Season {
  /** ключевые слова в названии/категории товара */
  match: RegExp
  /** месяцы пикового спроса */
  months: number[]
  /** повод/название сезона */
  occasion: string
}

export const SEASONS: Season[] = [
  { match: /канцеляр|тетрад|ручк|рюкзак|пенал|школ|портфел/i, months: [7, 8, 9], occasion: '1 сентября / школа' },
  { match: /куртк|пуховик|пальто|шапк|перчатк|тёпл|термо|обогреват/i, months: [10, 11, 12, 1, 2], occasion: 'зима / холода' },
  { match: /плавк|купальник|шорт|панам|солнцезащит|пляж|бассейн|вентилятор|кондиционер/i, months: [5, 6, 7, 8], occasion: 'лето / жара' },
  { match: /подар|игрушк|гирлянд|ёлк|елк|новогодн|конфет/i, months: [11, 12], occasion: 'Новый год' },
  { match: /косметик|парфюм|цвет|украшени|серьг/i, months: [2, 3], occasion: '14 февраля / 8 марта' },
  { match: /дач|сад|огород|семен|удобрени|мангал|гриль/i, months: [3, 4, 5, 6], occasion: 'дачный сезон' },
  { match: /зонт|дожд|резинов.{0,4}сапог/i, months: [3, 4, 9, 10], occasion: 'сезон дождей' },
]

const MONTH_NAME = ['', 'январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']

export interface SeasonStatus {
  season: Season
  active: boolean // сезон идёт сейчас
  soon: boolean // сезон в ближайшие 1-2 месяца
}

/** Сезонный статус товара по названию+категории на заданный месяц (по умолчанию текущий). */
export function seasonFor(title: string, category: string, month = new Date().getMonth() + 1): SeasonStatus | null {
  const text = `${title} ${category}`.toLowerCase()
  const season = SEASONS.find((s) => s.match.test(text))
  if (!season) return null
  const active = season.months.includes(month)
  const next1 = (month % 12) + 1
  const next2 = (next1 % 12) + 1
  const soon = !active && (season.months.includes(next1) || season.months.includes(next2))
  return { season, active, soon }
}

/** Проверяет, активен ли сезон товара или скоро будет активен (в ближайшие 1-2 месяца). */
export function isSeasonActiveOrUpcoming(title: string, category: string, month = new Date().getMonth() + 1): boolean {
  const status = seasonFor(title, category, month)
  return status ? (status.active || status.soon) : false
}

/** Какие сезоны актуальны в этом месяце — для подсказки «сейчас сезон для…». */
export function activeSeasons(month = new Date().getMonth() + 1): Season[] {
  return SEASONS.filter((s) => s.months.includes(month))
}

/** Сезоны, которые начнутся в ближайшие 1-2 месяца. */
export function upcomingSeasons(month = new Date().getMonth() + 1): Season[] {
  const next1 = (month % 12) + 1
  const next2 = (next1 % 12) + 1
  return SEASONS.filter((s) => !s.months.includes(month) && (s.months.includes(next1) || s.months.includes(next2)))
}

export function monthName(m: number): string {
  return MONTH_NAME[m] ?? ''
}
