import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowUpDown, BarChart3, CalendarDays, ChevronDown, ChevronRight, Columns3, Flame, Info, Loader2, Search, Sparkles, Star, X } from 'lucide-react'
import {
  productsFor,
  categoriesFor,
  MARKETPLACES,
  PERIODS,
  estMarginPct,
  potentialScore,
  scoreBreakdown,
  nicheStats,
  salesForPeriod,
  type Marketplace,
  type Period,
  type Product,
  type Competition,
} from '@/lib/mockData'
import { aiChat, type ChatProduct } from '@/lib/aiClient'
import { activeSeasons, monthName, seasonFor, SEASONS } from '@/lib/seasonality'
import { ProductThumb } from '@/components/ProductThumb'
import { CategoryGrid } from '@/screens/CategoryAnalytics'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip'
import { cn, formatMoney, formatNumber } from '@/lib/utils'

type SortKey = 'score' | 'periodSales' | 'estRevenuePerMonth' | 'ordersTotal' | 'margin' | 'competition' | 'trend'
type ChipKey = 'trend' | 'lowComp' | 'margin' | 'season'
type Tab = 'products' | 'categories'

const COMP_LABEL: Record<Competition, string> = { low: 'низкая', med: 'средняя', high: 'высокая' }
/** Числовой ранг конкуренции для сортировки: низкая = лучше = выше. */
const COMP_RANK: Record<Competition, number> = { low: 3, med: 2, high: 1 }
const MARGIN_THRESHOLD = 5

export function NicheSearch({
  marketplace,
  urlCategory,
  urlTab,
  onSyncUrl,
  onOpenProduct,
}: {
  marketplace: Marketplace
  urlCategory?: string
  urlTab?: Tab
  onSyncUrl?: (params: Record<string, string>) => void
  onOpenProduct: (id: string) => void
}) {
  const products = useMemo(() => productsFor(marketplace), [marketplace])
  const categories = useMemo(() => categoriesFor(marketplace), [marketplace])
  const validCategory = urlCategory && categories.includes(urlCategory) ? urlCategory : undefined
  // Таб и категория ВЕДУТСЯ ИЗ URL (переживают переход в товар и «назад»).
  const tab: Tab = urlTab === 'products' || validCategory ? 'products' : 'categories'
  const category = validCategory ?? 'all'

  function setTab(next: Tab) {
    onSyncUrl?.(next === 'categories' ? {} : { tab: 'products', ...(category !== 'all' ? { category } : {}) })
  }
  function setCategory(cat: string) {
    onSyncUrl?.({ tab: 'products', ...(cat !== 'all' ? { category: cat } : {}) })
  }

  // Клик по карточке категории внутри таба «Категории».
  function openCategory(cat: string) {
    onSyncUrl?.({ tab: 'products', category: cat })
  }
  const [query, setQuery] = useState('')
  const [chips, setChips] = useState<Set<ChipKey>>(new Set())
  const [period, setPeriod] = useState<Period>('all')
  const [sortKey, setSortKey] = useState<SortKey>('score')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  /** Клик по сортировке: если она уже активна — отключаем (возврат к дефолту по баллу). */
  function toggleSort(key: SortKey) {
    setSortKey((cur) => (cur === key ? 'score' : key))
  }

  // Выбор товаров для сравнения / экспорта.
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const periodLabel = PERIODS.find((p) => p.value === period)!.label
  const periodExact = period === 'all'

  function toggleChip(c: ChipKey) {
    setChips((prev) => {
      const next = new Set(prev)
      if (next.has(c)) next.delete(c)
      else next.add(c)
      return next
    })
  }

  const rows = useMemo(() => {
    const list = products.filter((p) => {
      if (category !== 'all' && p.category !== category) return false
      if (query && !p.title.toLowerCase().includes(query.toLowerCase())) return false
      if (chips.has('trend') && p.demandProxy < 50) return false
      if (chips.has('lowComp') && p.competition !== 'low') return false
      if (chips.has('margin') && estMarginPct(p.price, marketplace, p.category) < MARGIN_THRESHOLD) return false
      if (chips.has('season') && !seasonFor(p.title, p.category)?.active) return false
      return true
    })
    return [...list].sort((a, b) => sortValue(b, sortKey, marketplace, period) - sortValue(a, sortKey, marketplace, period))
  }, [products, category, query, chips, sortKey, marketplace, period])

  // Сброс страницы при изменении фильтров/сортировки/периода/категории.
  useEffect(() => {
    setPage(0)
  }, [category, query, chips, sortKey, period])

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pageRows = useMemo(() => rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE), [rows, page])

  const kpi = useMemo(() => {
    const n = rows.length || 1
    return {
      count: rows.length,
      orders: rows.reduce((s, p) => s + p.ordersTotal, 0),
      hotDemand: rows.filter((p) => p.demandProxy >= 50).length,
      avgMargin: rows.reduce((s, p) => s + estMarginPct(p.price, marketplace, p.category), 0) / n,
    }
  }, [rows, marketplace])

  const mpLabel = MARKETPLACES[marketplace].label

  // Выбранные товары среди текущей выборки (если фильтр убрал — выпадают из счётчика).
  const selectedRows = useMemo(() => rows.filter((p) => selected.has(p.id)), [rows, selected])
  const canCompare = selectedRows.length >= 2 && selectedRows.length <= 4

  return (
    <TooltipProvider delayDuration={200}>
      <div className="h-full overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-[1700px] px-6 py-8 lg:px-8">
          {/* Хлебная крошка «Все категории» — НАД заголовком, только на табе «Товары» из конкретной ниши. */}
          {tab === 'products' && category !== 'all' && (
            <button
              onClick={() => setTab('categories')}
              className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeft className="size-4" />
              Все категории
            </button>
          )}

          <header className="mb-6">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <BarChart3 className="size-6 text-primary" />
              Поиск ниши · {mpLabel}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {tab === 'categories' ? (
                <>Сначала выберите нишу, затем разберите её лучшие товары.</>
              ) : (
                <>
                  Лучшие товары {mpLabel} за: <span className="font-medium text-foreground">{periodLabel.toLowerCase()}</span> ·
                  спрос, реальные заказы, оценка выручки и потенциал маржи.
                </>
              )}
            </p>
          </header>

          {/* Табы: Категории (шаг 1) / Товары */}
          <div className="mb-5 inline-flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1">
            {([
              { value: 'categories', label: 'Категории' },
              { value: 'products', label: 'Товары' },
            ] as const).map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={cn(
                  'rounded-md px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  tab === t.value
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'categories' ? (
            <CategoryGrid marketplace={marketplace} onOpenCategory={openCategory} />
          ) : (
            <>
          <SeasonBanner />
          {/* KPI */}
          <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Проанализировано товаров" value={formatNumber(kpi.count)} note="из выборки Uzum" />
            <KpiCard label="Всего заказов" value={formatNumber(kpi.orders)} variant="exact" badge="точно" />
            <KpiCard label="Высокий спрос" value={`${kpi.hotDemand} из ${rows.length}`} note="по снимку Uzum" />
            <KpiCard
              label="Ср. оценка маржи"
              value={Number.isFinite(kpi.avgMargin) ? `${kpi.avgMargin.toFixed(1)}%` : '—'}
              variant="potential"
              badge="потенциал"
            />
          </div>

          {/* Единая панель управления: категория + поиск · фильтры · период + сравнить */}
          <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border bg-card px-3 py-2.5">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-44">
                <option value="all">Все категории</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              <div className="relative max-w-xs flex-1">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="w-full pl-9"
                  placeholder="Поиск по названию…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="h-6 w-px bg-border" />

            <div className="flex flex-wrap items-center gap-1.5">
              <Chip active={chips.has('trend')} onClick={() => toggleChip('trend')}>
                Высокий спрос
              </Chip>
              <Chip active={chips.has('lowComp')} onClick={() => toggleChip('lowComp')}>
                Низкая конкуренция
              </Chip>
              <Chip active={chips.has('margin')} onClick={() => toggleChip('margin')}>
                Маржа ≥ {MARGIN_THRESHOLD}%
              </Chip>
              <Chip active={chips.has('season')} onClick={() => toggleChip('season')}>
                В сезоне
              </Chip>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Select value={period} onChange={(e) => setPeriod(e.target.value as Period)} className="w-36">
                {PERIODS.map((pr) => (
                  <option key={pr.value} value={pr.value}>
                    {pr.label}
                  </option>
                ))}
              </Select>
              {!selectMode ? (
                <Button variant="outline" size="sm" onClick={() => setSelectMode(true)}>
                  <Columns3 /> Сравнить товары
                </Button>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Выбрано <span className="font-semibold tabular-nums text-foreground">{selectedRows.length}</span>/4
                  </span>
                  <Button size="sm" disabled={!canCompare} onClick={() => setCompareOpen(true)}>
                    <Columns3 /> Сравнить
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectMode(false)
                      setSelected(new Set())
                    }}
                  >
                    Отмена
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Niche analytics */}
          {category !== 'all' && <NichePanel category={category} marketplace={marketplace} />}

          {/* Актуальные ниши — спойлер «что продавать прямо сейчас» (свёрнут по умолчанию) */}
          <HotNichesBlock category={category} marketplace={marketplace} onOpenProduct={onOpenProduct} />

          {/* Table */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-muted/30">
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      {selectMode && (
                        <th className="w-8 px-2.5 py-2.5">
                          <span className="sr-only">Выбор</span>
                        </th>
                      )}
                      <th className="whitespace-nowrap px-2.5 py-2.5 font-medium">Товар</th>
                      <SortableTh
                        label="Балл"
                        active={sortKey === 'score'}
                        onClick={() => toggleSort('score')}
                        hint="score"
                      />
                      <th className="whitespace-nowrap px-2.5 py-2.5 text-right font-medium">Цена</th>
                      <SortableTh
                        label="Заказов"
                        active={sortKey === 'ordersTotal'}
                        onClick={() => toggleSort('ordersTotal')}
                        hint="exact"
                      />
                      <SortableTh
                        label={`Продажи за ${periodLabel.toLowerCase()}`}
                        active={sortKey === 'periodSales'}
                        onClick={() => setSortKey('periodSales')}
                        hint={periodExact ? 'exact' : 'estimate'}
                      />
                      <SortableTh
                        label="Выручка/мес"
                        active={sortKey === 'estRevenuePerMonth'}
                        onClick={() => toggleSort('estRevenuePerMonth')}
                        hint="estimate"
                      />
                      <th className="whitespace-nowrap px-2.5 py-2.5 text-right font-medium">Рейтинг</th>
                      <SortableTh
                        label="Спрос"
                        active={sortKey === 'trend'}
                        onClick={() => toggleSort('trend')}
                        align="left"
                      />
                      <SortableTh
                        label="Конкуренция"
                        active={sortKey === 'competition'}
                        onClick={() => toggleSort('competition')}
                        align="left"
                      />
                      <SortableTh
                        label="Оценка маржи"
                        active={sortKey === 'margin'}
                        onClick={() => toggleSort('margin')}
                        hint="potential"
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((p) => (
                      <Row
                        key={p.id}
                        p={p}
                        marketplace={marketplace}
                        period={period}
                        periodExact={periodExact}
                        selectMode={selectMode}
                        selected={selected.has(p.id)}
                        onToggle={() => toggleSelect(p.id)}
                        onClick={() => onOpenProduct(p.id)}
                      />
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={selectMode ? 11 : 10} className="px-4 py-16 text-center">
                          <Search className="mx-auto mb-3 size-8 text-muted-foreground/50" />
                          <p className="text-muted-foreground">Ничего не найдено — измените фильтры.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Пагинация */}
          {rows.length > PAGE_SIZE && (
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground tabular-nums">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, rows.length)} из {rows.length}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  Назад
                </Button>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {page + 1} / {pageCount}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pageCount - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Вперёд
                </Button>
              </div>
            </div>
          )}

          {!periodExact && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-warning">
              <Info className="size-3.5 shrink-0" />
              Продажи за период — оценка, реальная история собирается по дням (дельта-метод).
            </p>
          )}

          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="size-3.5" />
            Цена, рейтинг, отзывы и число заказов — точные данные с витрины {mpLabel}. Продажи и выручка — оценка, маржа —
            потенциал по тарифам {mpLabel}.
          </p>

          {compareOpen && canCompare && (
            <CompareModal products={selectedRows} marketplace={marketplace} onClose={() => setCompareOpen(false)} />
          )}
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

/** Сравнение 2–4 товаров колонками. Лучшее значение в строке подсвечено. */
function CompareModal({
  products,
  marketplace,
  onClose,
}: {
  products: Product[]
  marketplace: Marketplace
  onClose: () => void
}) {
  const cols = products.map((p) => ({
    p,
    margin: estMarginPct(p.price, marketplace),
    score: potentialScore(p, marketplace),
  }))

  // Индексы «лучшего» для подсветки. Для цены лучше — ниже; для конкуренции — низкая.
  const best = (vals: number[], higherBetter = true) => {
    let bi = 0
    for (let i = 1; i < vals.length; i++) {
      if (higherBetter ? vals[i] > vals[bi] : vals[i] < vals[bi]) bi = i
    }
    return bi
  }
  const bestOrders = best(cols.map((c) => c.p.ordersTotal))
  const bestSales = best(cols.map((c) => c.p.estSalesPerMonth))
  const bestRevenue = best(cols.map((c) => c.p.estRevenuePerMonth))
  const bestRating = best(cols.map((c) => c.p.rating))
  const bestPrice = best(cols.map((c) => c.p.price), false)
  const bestComp = best(cols.map((c) => COMP_RANK[c.p.competition]))
  const bestMargin = best(cols.map((c) => c.margin))
  const bestScore = best(cols.map((c) => c.score))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <Card
        className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Columns3 className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Сравнение товаров · {products.length}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Закрыть"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-auto scrollbar-thin">
          <table className="w-full text-sm">
            <tbody>
              <CmpRow label="Фото">
                {cols.map((c) => (
                  <td key={c.p.id} className="px-4 py-3 align-top">
                    <ProductThumb src={c.p.image} alt={c.p.title} className="size-16 rounded-md border border-border" />
                  </td>
                ))}
              </CmpRow>
              <CmpRow label="Название">
                {cols.map((c) => (
                  <td key={c.p.id} className="px-4 py-3 align-top font-medium leading-tight">
                    {c.p.title}
                    <div className="mt-0.5 text-xs font-normal text-muted-foreground">{c.p.category}</div>
                  </td>
                ))}
              </CmpRow>
              <CmpRow label="Цена">
                {cols.map((c, i) => (
                  <CmpCell key={c.p.id} highlight={i === bestPrice}>
                    {formatMoney(c.p.price, c.p.currency)}
                  </CmpCell>
                ))}
              </CmpRow>
              <CmpRow label="Заказов">
                {cols.map((c, i) => (
                  <CmpCell key={c.p.id} highlight={i === bestOrders}>
                    {formatNumber(c.p.ordersTotal)}
                  </CmpCell>
                ))}
              </CmpRow>
              <CmpRow label="Оценка продаж/мес">
                {cols.map((c, i) => (
                  <CmpCell key={c.p.id} highlight={i === bestSales}>
                    {formatNumber(c.p.estSalesPerMonth)}
                  </CmpCell>
                ))}
              </CmpRow>
              <CmpRow label="Оценка выручки/мес">
                {cols.map((c, i) => (
                  <CmpCell key={c.p.id} highlight={i === bestRevenue}>
                    {formatMoney(c.p.estRevenuePerMonth, c.p.currency)}
                  </CmpCell>
                ))}
              </CmpRow>
              <CmpRow label="Рейтинг">
                {cols.map((c, i) => (
                  <CmpCell key={c.p.id} highlight={i === bestRating}>
                    <span className="inline-flex items-center gap-1">
                      <Star className="size-3.5 fill-warning text-warning" />
                      {c.p.rating.toFixed(1)}
                    </span>
                  </CmpCell>
                ))}
              </CmpRow>
              <CmpRow label="Конкуренция">
                {cols.map((c, i) => (
                  <td
                    key={c.p.id}
                    className={cn('px-4 py-3 align-top', i === bestComp && 'bg-success/10')}
                  >
                    <Badge variant={c.p.competition}>{COMP_LABEL[c.p.competition]}</Badge>
                  </td>
                ))}
              </CmpRow>
              <CmpRow label="Оценка маржи %">
                {cols.map((c, i) => (
                  <CmpCell key={c.p.id} highlight={i === bestMargin}>
                    {c.margin}%
                  </CmpCell>
                ))}
              </CmpRow>
              <CmpRow label="Балл потенциала">
                {cols.map((c, i) => (
                  <CmpCell key={c.p.id} highlight={i === bestScore}>
                    <ScoreBadge score={c.score} />
                  </CmpCell>
                ))}
              </CmpRow>
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-5 py-2.5 text-[11px] text-muted-foreground">
          <Info className="mr-1 inline size-3.5 align-text-bottom" />
          Подсвечено лучшее значение в строке. Продажи и выручка — оценка, маржа — потенциал по тарифам{' '}
          {MARKETPLACES[marketplace].label}.
        </div>
      </Card>
    </div>
  )
}

function CmpRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-border/60 last:border-0">
      <th className="sticky left-0 z-10 w-44 whitespace-nowrap bg-card px-4 py-3 text-left align-top text-xs font-medium text-muted-foreground">
        {label}
      </th>
      {children}
    </tr>
  )
}

function CmpCell({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <td
      className={cn(
        'px-4 py-3 align-top font-medium tabular-nums',
        highlight && 'bg-success/10 font-bold text-success',
      )}
    >
      {children}
    </td>
  )
}

/** Панель аналитики ниши: реальная насыщенность + средние/медиана + концентрация выручки. */
function NichePanel({ category, marketplace }: { category: string; marketplace: Marketplace }) {
  const stats = nicheStats(category, marketplace)
  if (!stats) return null

  const interpretation =
    stats.nicheSize > 0 && stats.nicheSize < 100
      ? 'Свободная ниша — мало конкурентов, проще войти.'
      : stats.top3RevenueShare > 70
        ? 'Ниша захвачена лидерами — топ-3 забирают большую часть выручки, сложно войти.'
        : stats.competition === 'high'
          ? 'Высокая насыщенность — много конкурентов, нужен сильный оффер.'
          : 'Ниша со средней конкуренцией — есть место для нового игрока.'

  return (
    <Card className="mb-4">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">Аналитика ниши · {category}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <NicheStat label="Размер ниши" value={`${formatNumber(stats.nicheSize)} тов.`} badge="реально" badgeVariant="exact" />
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="text-[11px] text-muted-foreground">Конкуренция</div>
            <div className="mt-1.5">
              <Badge variant={stats.competition}>{COMP_LABEL[stats.competition]}</Badge>
            </div>
          </div>
          <NicheStat label="Средняя цена" value={formatMoney(stats.avgPrice, stats.currency)} />
          <NicheStat label="Медиана заказов" value={formatNumber(stats.medianOrders)} badge="точно" badgeVariant="exact" />
          <NicheStat
            label="Ср. выручка/мес"
            value={formatMoney(stats.avgRevenue, stats.currency)}
            badge="оценка"
            badgeVariant="estimate"
          />
          <NicheStat label="Концентрация топ-3" value={`${stats.top3RevenueShare}%`} note="доля выручки" />
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="size-3.5 shrink-0" />
          В нише {formatNumber(stats.nicheSize)} товаров, из них проанализировано{' '}
          <span className="font-medium text-foreground">{stats.productsInPool}</span>. {interpretation} Топ-3 забирают{' '}
          {stats.top3RevenueShare}% выручки ниши.
        </p>
      </CardContent>
    </Card>
  )
}

function NicheStat({
  label,
  value,
  note,
  badge,
  badgeVariant,
}: {
  label: string
  value: string
  note?: string
  badge?: string
  badgeVariant?: 'exact' | 'estimate' | 'potential'
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-bold tabular-nums">{value}</div>
      <div className="mt-1">
        {badge && badgeVariant ? (
          <Badge variant={badgeVariant}>
            <Info className="size-3" /> {badge}
          </Badge>
        ) : (
          note && <span className="text-[11px] text-muted-foreground">{note}</span>
        )}
      </div>
    </div>
  )
}

function buildReasons(p: Product, marketplace: Marketplace): string[] {
  const b = scoreBreakdown(p, marketplace)
  const margin = estMarginPct(p.price, marketplace, p.category)
  const candidates: { strength: number; text: string }[] = []

  if (p.demandProxy >= 60) candidates.push({ strength: p.demandProxy, text: `высокий спрос (${formatNumber(p.ordersTotal)} заказов)` })
  else if (p.demandProxy >= 45) candidates.push({ strength: p.demandProxy, text: `стабильный спрос (${formatNumber(p.ordersTotal)} заказов)` })

  if (p.competition === 'low') candidates.push({ strength: 80, text: 'низкая конкуренция в нише' })
  else if (p.competition === 'med') candidates.push({ strength: 50, text: 'умеренная конкуренция' })

  if (margin >= 10) candidates.push({ strength: margin, text: `маржа ~${Math.round(margin)}%` })

  if (b.revenue >= 70) candidates.push({ strength: b.revenue, text: 'сильная оценка выручки' })

  return candidates
    .sort((a, c) => c.strength - a.strength)
    .slice(0, 3)
    .map((c) => c.text)
}

/** Соединить причины в человекочитаемое предложение с заглавной буквы. */
function composeReason(reasons: string[]): string {
  if (!reasons.length) return 'Сбалансированные метрики — стабильный кандидат.'
  const s = reasons.join(' + ')
  return s.charAt(0).toUpperCase() + s.slice(1) + '.'
}

/** Сезонность: свёрнутая полоса «сейчас сезон…», раскрывается в календарь сезонов. */
function SeasonBanner() {
  const [open, setOpen] = useState(false)
  const active = activeSeasons()
  const month = new Date().getMonth() + 1

  return (
    <div className="mb-4 overflow-hidden rounded-lg border border-border bg-muted/40">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CalendarDays className="size-4 shrink-0 text-primary" />
        <span className="font-medium">Календарь сезонов</span>
        {active.length > 0 && (
          <span className="truncate text-muted-foreground">· сейчас: {active.map((s) => s.occasion).join(', ')}</span>
        )}
        <ChevronDown className={cn('ml-auto size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="border-t border-border px-4 py-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SEASONS.map((s) => {
              const isActive = s.months.includes(month)
              return (
                <div
                  key={s.occasion}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm',
                    isActive ? 'border-success/40 bg-success/10' : 'border-border',
                  )}
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    {isActive && <Flame className="size-3.5 text-success" />}
                    {s.occasion}
                  </span>
                  <span className={cn('tabular-nums', isActive ? 'text-success' : 'text-muted-foreground')}>
                    {monthRange(s.months)}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Календарь-подсказка по типу товара (не прогноз из истории). Товары «в сезоне» получают бонус к баллу и
            поднимаются в топе.
          </p>
        </div>
      )}
    </div>
  )
}

/** Месяцы [5,6,7,8] → «май–авг»; разрывы через запятую. */
function monthRange(months: number[]): string {
  const sorted = [...months].sort((a, b) => a - b)
  const groups: number[][] = []
  for (const m of sorted) {
    const last = groups[groups.length - 1]
    if (last && m === last[last.length - 1] + 1) last.push(m)
    else groups.push([m])
  }
  return groups
    .map((g) => (g.length === 1 ? monthName(g[0]) : `${monthName(g[0])}–${monthName(g[g.length - 1])}`))
    .join(', ')
}

/** Highlight-блок: топ-3–4 товара по баллу потенциала + гибридный ИИ-разбор. */
function HotNichesBlock({
  category,
  marketplace,
  onOpenProduct,
}: {
  category: string
  marketplace: Marketplace
  onOpenProduct: (id: string) => void
}) {
  const top = useMemo(() => {
    const all = productsFor(marketplace)
    const pool = category === 'all' ? all : all.filter((p) => p.category === category)
    return [...pool]
      .sort((a, b) => potentialScore(b, marketplace) - potentialScore(a, marketplace))
      .slice(0, 4)
  }, [category, marketplace])

  const [expanded, setExpanded] = useState(true)
  const [aiText, setAiText] = useState<string | null>(null)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  async function deepDive() {
    if (aiOpen) {
      setAiOpen(false)
      return
    }
    setAiOpen(true)
    if (aiText || aiLoading) return
    setAiLoading(true)
    try {
      const chatProducts: ChatProduct[] = top.map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        orders: p.ordersTotal,
        price: p.price,
        demand: p.demandProxy,
        margin: estMarginPct(p.price, marketplace, p.category),
      }))
      const res = await aiChat('Почему эти товары стоит продавать сейчас и какие риски?', chatProducts)
      setAiText(res.text?.trim() || 'ИИ-разбор временно недоступен (лимит).')
    } catch {
      setAiText('ИИ-разбор временно недоступен (лимит).')
    } finally {
      setAiLoading(false)
    }
  }

  if (!top.length) return null

  return (
    <div className="mb-4">
      {/* Свёрнутая полоса-спойлер */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-2.5">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Flame className="size-4" />
          </span>
          <span className="truncate text-sm font-medium">
            Что продавать прямо сейчас · топ-{top.length}
          </span>
          <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
        </button>
        <Button variant="outline" size="sm" onClick={deepDive}>
          <Sparkles /> Разобрать (ИИ)
        </Button>
      </div>

      {expanded && (
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {top.map((p) => {
            const score = potentialScore(p, marketplace)
            const reason = composeReason(buildReasons(p, marketplace))
            return (
              <button
                key={p.id}
                onClick={() => onOpenProduct(p.id)}
                className="group flex flex-col rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start gap-3">
                  <ProductThumb src={p.image} alt={p.title} className="size-12 shrink-0 rounded-md border border-border" />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-sm font-medium leading-tight">{p.title}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm font-semibold tabular-nums">{formatMoney(p.price, p.currency)}</span>
                      <ScoreBadge score={score} />
                    </div>
                  </div>
                </div>
                <p className="mt-2.5 text-xs leading-snug text-muted-foreground">
                  <span className="font-medium text-foreground">Почему стоит: </span>
                  {reason}
                </p>
                <span className="mt-2 inline-flex items-center gap-0.5 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Разобрать товар <ChevronRight className="size-3.5" />
                </span>
              </button>
            )
          })}
      </div>
      )}

      {aiOpen && (
        <div className="mt-3 rounded-lg border border-border bg-card p-4 text-sm">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" /> ИИ-разбор
          </div>
          {aiLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Анализирую…
            </div>
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed text-foreground">{aiText}</p>
          )}
        </div>
      )}
    </div>
  )
}

function sortValue(p: Product, key: SortKey, mp: Marketplace, period: Period): number {
  if (key === 'score') return potentialScore(p, mp)
  if (key === 'margin') return estMarginPct(p.price, mp, p.category)
  if (key === 'competition') return COMP_RANK[p.competition]
  if (key === 'trend') return p.demandProxy
  if (key === 'periodSales') return salesForPeriod(p, period)
  return p[key]
}

function Row({
  p,
  marketplace,
  period,
  periodExact,
  selectMode,
  selected,
  onToggle,
  onClick,
}: {
  p: Product
  marketplace: Marketplace
  period: Period
  periodExact: boolean
  selectMode: boolean
  selected: boolean
  onToggle: () => void
  onClick: () => void
}) {
  const margin = estMarginPct(p.price, marketplace, p.category)
  const score = potentialScore(p, marketplace)
  const periodVal = salesForPeriod(p, period)
  const season = seasonFor(p.title, p.category)
  return (
    <tr
      onClick={selectMode ? onToggle : onClick}
      className={cn(
        'cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-accent/50',
        selected && 'bg-primary/5',
      )}
    >
      {selectMode && (
        <td className="px-2.5 py-2.5" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            aria-label={`Выбрать ${p.title}`}
            className="size-4 cursor-pointer accent-[hsl(var(--primary))]"
          />
        </td>
      )}
      <td className="w-[240px] max-w-[240px] px-2.5 py-2.5">
        <div className="flex items-center gap-2.5">
          <ProductThumb src={p.image} alt={p.title} className="size-9 shrink-0 rounded-md border border-border" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-medium leading-tight">{p.title}</span>
              {season?.active && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-success">
                      <Flame className="size-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Сейчас сезон: {season.season.occasion}</TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="truncate text-xs text-muted-foreground">{p.category}</div>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-2.5 py-2.5 text-right">
        <ScoreBadge score={score} />
      </td>
      <td className="whitespace-nowrap px-2.5 py-2.5 text-right tabular-nums">{formatMoney(p.price, p.currency)}</td>
      <td className="whitespace-nowrap px-2.5 py-2.5 text-right font-medium tabular-nums">{formatNumber(p.ordersTotal)}</td>
      <td className="whitespace-nowrap px-2.5 py-2.5 text-right">
        <span className="inline-flex items-center gap-1.5">
          <span className="font-medium tabular-nums">{formatNumber(periodVal)}</span>
          <Badge variant={periodExact ? 'exact' : 'estimate'}>{periodExact ? 'точно' : 'оценка'}</Badge>
        </span>
      </td>
      <td className="whitespace-nowrap px-2.5 py-2.5 text-right tabular-nums">{formatMoney(p.estRevenuePerMonth, p.currency)}</td>
      <td className="whitespace-nowrap px-2.5 py-2.5 text-right">
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Star className="size-3.5 fill-warning text-warning" />
          {p.rating.toFixed(1)}
        </span>
      </td>
      <td className="whitespace-nowrap px-2.5 py-2.5">
        <DemandMeter value={p.demandProxy} />
      </td>
      <td className="px-2.5 py-2.5">
        <Badge variant={p.competition}>{COMP_LABEL[p.competition]}</Badge>
      </td>
      <td className="whitespace-nowrap px-2.5 py-2.5 text-right">
        <span className="font-semibold tabular-nums text-primary">{margin}%</span>
      </td>
    </tr>
  )
}

/** Бейдж балла потенциала 0–100: зелёный (хорошо) → жёлтый → серый. */
function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 65
      ? 'bg-success/15 text-success'
      : score >= 45
        ? 'bg-warning/15 text-warning'
        : 'bg-muted text-muted-foreground'
  return (
    <span className={cn('inline-flex min-w-9 items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold tabular-nums', tone)}>
      {score}
    </span>
  )
}

/** Индикатор спроса 0–100 (прокси по снимку): полоска + число. */
function DemandMeter({ value }: { value: number }) {
  const tone = value >= 60 ? 'bg-success' : value >= 35 ? 'bg-warning' : 'bg-muted-foreground/50'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', tone)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium tabular-nums text-muted-foreground">{value}</span>
    </div>
  )
}

function KpiCard({
  label,
  value,
  note,
  variant,
  badge,
}: {
  label: string
  value: string
  note?: string
  variant?: 'exact' | 'estimate' | 'potential'
  badge?: string
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1.5 text-2xl font-bold tabular-nums">{value}</div>
        <div className="mt-1.5">
          {variant ? (
            <Badge variant={variant}>
              <Info className="size-3" /> {badge}
            </Badge>
          ) : (
            note && <span className="text-[11px] text-muted-foreground">{note}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent',
      )}
    >
      {children}
    </button>
  )
}

function SortableTh({
  label,
  active,
  onClick,
  hint,
  align = 'right',
}: {
  label: string
  active: boolean
  onClick: () => void
  hint?: 'exact' | 'estimate' | 'potential' | 'score'
  align?: 'left' | 'right'
}) {
  const hintText =
    hint === 'exact'
      ? 'Точные данные с витрины'
      : hint === 'estimate'
        ? 'Оценка по дельта-методу'
        : hint === 'potential'
          ? 'Потенциал маржи (зависит от закупки)'
          : hint === 'score'
            ? 'Балл потенциала 0–100: тренд + конкуренция + выручка + маржа. Чем выше — тем лучше для продажи.'
            : 'Нажмите для сортировки'
  const hintBadge =
    hint === 'exact' ? 'точно' : hint === 'estimate' ? 'оц.' : hint === 'potential' ? 'пот.' : null
  const button = (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 hover:text-foreground',
        align === 'right' && 'ml-auto',
        active && 'text-primary',
      )}
    >
      {label}
      {hintBadge && hint && hint !== 'score' && (
        <span className="text-[10px] font-normal text-muted-foreground/70">{hintBadge}</span>
      )}
      <ArrowUpDown className="size-3" />
    </button>
  )
  return (
    <th className={cn('whitespace-nowrap px-2.5 py-2.5 font-medium', align === 'right' && 'text-right')}>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>{hintText}</TooltipContent>
      </Tooltip>
    </th>
  )
}
