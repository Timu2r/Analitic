import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ExternalLink,
  Info,
  Minus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Truck,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  categoryCommissionPct,
  estMarginPct,
  getProduct,
  MARKETPLACES,
  nicheStats,
  potentialScore,
  scoreBreakdown,
  seasonAdjustment,
  productsFor,
  productExternal,
  type Marketplace,
  type Product,
} from '@/lib/mockData'
import { ProductThumb } from '@/components/ProductThumb'
import { ProductAnalysisCard, useProductAnalysis } from '@/components/ProductAnalysisCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn, formatMoney, formatNumber } from '@/lib/utils'

const AXIS = 'hsl(var(--muted-foreground))'
const GRID = 'hsl(var(--border))'
const PRIMARY = 'hsl(var(--primary))'

const COMP_LABEL = { low: 'низкая', med: 'средняя', high: 'высокая' } as const

/** Уровень доверия к индексу — честно по полноте реальных данных (заказы/отзывы). */
type TrustLevel = 'low' | 'med' | 'high'
function trustLevel(product: Product): { level: TrustLevel; label: string; reason: string } {
  if (product.ordersTotal >= 100 && product.reviews >= 20)
    return { level: 'high', label: 'высокий', reason: 'много реальных заказов и отзывов' }
  if (product.ordersTotal >= 20) return { level: 'med', label: 'средний', reason: 'есть реальные заказы, отзывов немного' }
  return { level: 'low', label: 'низкий', reason: 'мало реальных заказов/отзывов — сигнал слабый' }
}

/** Ядро названия для поиска поставщика: первые значимые слова, без хвостов вроде объёма/цвета. */
function coreQuery(title: string): string {
  return title
    .replace(/[«»"'(),]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .join(' ')
    .trim()
}

const SUPPLIER_1688 = (q: string) =>
  `https://s.1688.com/selloffer/offer_search.htm?keywords=${encodeURIComponent(q)}`
const SUPPLIER_ALIBABA = (q: string) =>
  `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(q)}`


export function ProductDetail({
  productId,
  marketplace,
  onBack,
}: {
  productId: string
  marketplace: Marketplace
  onBack: () => void
}) {
  const product = getProduct(productId)
  const mp = MARKETPLACES[marketplace]

  const [purchase, setPurchase] = useState<string>(product ? String(Math.round(product.price * 0.45)) : '0')
  const [logistics, setLogistics] = useState<string>(String(mp.logistics))
  const [taxPct, setTaxPct] = useState<string>('4')
  const [acquiringPct, setAcquiringPct] = useState<string>('0')
  const [adPerUnit, setAdPerUnit] = useState<string>('0')
  const [supplierOpen, setSupplierOpen] = useState(false)
  const [supplierQuery, setSupplierQuery] = useState<string>(product ? coreQuery(product.title) : '')
  const { state: analysisState, run: runAnalysis } = useProductAnalysis(
    product ?? ({ title: '', category: '', rating: 0, reviews: 0, ordersTotal: 0 } as Product),
  )

  const commPct = product ? categoryCommissionPct(product.category, marketplace) : mp.commission * 100

  const calc = useMemo(() => {
    const price = product?.price ?? 0
    const purchaseNum = Math.max(0, Number(purchase) || 0)
    const logisticsNum = Math.max(0, Number(logistics) || 0)
    const taxNum = Math.max(0, Number(taxPct) || 0)
    const acquiringNum = Math.max(0, Number(acquiringPct) || 0)
    const adNum = Math.max(0, Number(adPerUnit) || 0)
    const commissionAmt = price * (commPct / 100)
    const taxAmt = price * (taxNum / 100)
    const acquiringAmt = price * (acquiringNum / 100)
    const profit = price - commissionAmt - logisticsNum - taxAmt - acquiringAmt - adNum - purchaseNum
    const marginPct = price ? (profit / price) * 100 : 0
    const markupPct = purchaseNum ? ((price - purchaseNum) / purchaseNum) * 100 : 0
    const roiPct = purchaseNum ? (profit / purchaseNum) * 100 : 0
    return {
      purchaseNum,
      commissionAmt,
      logistics: logisticsNum,
      taxAmt,
      acquiringAmt,
      adNum,
      profit,
      marginPct,
      markupPct,
      roiPct,
    }
  }, [purchase, logistics, taxPct, acquiringPct, adPerUnit, product, commPct])

  if (!product) {
    return (
      <div className="p-8">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft /> Назад
        </Button>
        <p className="mt-4 text-muted-foreground">Товар не найден.</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-[1100px] px-6 py-8 lg:px-10">
        <Button variant="ghost" className="mb-4 -ml-2" onClick={onBack}>
          <ArrowLeft /> К поиску ниши
        </Button>

        {/* Header */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start">
          <ProductThumb
            src={product.image}
            alt={product.title}
            className="size-20 shrink-0 rounded-xl border border-border"
          />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{product.title}</h1>
              <Badge variant="outline">{MARKETPLACES[marketplace].label}</Badge>
              <Badge>{product.category}</Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              <span className="text-base font-semibold text-foreground">{formatMoney(product.price, product.currency)}</span>
              <span className="flex items-center gap-1">
                <Star className="size-4 fill-warning text-warning" /> {product.rating.toFixed(1)}
              </span>
              <span>{formatNumber(product.reviews)} отзывов</span>
              <span className="flex items-center gap-1.5">
                <Store className="size-4" /> {product.seller}
              </span>
              <a
                href={productExternal(product).url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary transition-colors hover:underline"
              >
                {productExternal(product).label} <ExternalLink className="size-3.5" />
              </a>
            </div>

            {/* Действия: анализ товара (ИИ) + воронка продавца (поиск поставщика) */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                onClick={runAnalysis}
                disabled={analysisState.status === 'loading'}
              >
                <Sparkles /> Анализ товара (ИИ)
              </Button>
              <Button variant="outline" onClick={() => setSupplierOpen((v) => !v)}>
                <Truck /> Найти поставщика
              </Button>
            </div>

            {supplierOpen && (
              <SupplierPanel
                query={supplierQuery}
                onChange={setSupplierQuery}
                resetQuery={() => setSupplierQuery(coreQuery(product.title))}
              />
            )}
          </div>
        </div>

        {/* Honesty banner */}
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs leading-relaxed text-warning">
          <Info className="mt-0.5 size-4 shrink-0" />
          <span>
            <strong>Число заказов</strong>, цена, рейтинг и отзывы берутся <strong>точно</strong> с витрины{' '}
            {MARKETPLACES[marketplace].label}. Продажи и выручка за месяц — <strong>оценка</strong> по дельта-методу
            (ежедневные снимки остатка и отзывов → расчёт продаж). Маржа — <strong>потенциал</strong>, зависит от вашей
            закупки.
          </span>
        </div>

        {/* Анализ товара (ИИ) — высоко на странице, появляется после клика */}
        {analysisState.status !== 'idle' && (
          <div className="mb-6">
            <ProductAnalysisCard state={analysisState} onRun={runAnalysis} />
          </div>
        )}

        {/* KPI tiles */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Tile label="Всего заказов" value={formatNumber(product.ordersTotal)} variant="exact" badge="точно" />
          <Tile label="Оценка продаж / мес" value={formatNumber(product.estSalesPerMonth)} variant="estimate" badge="оценка" />
          <Tile
            label="Оценка выручки / мес"
            value={formatMoney(product.estRevenuePerMonth, product.currency)}
            variant="estimate"
            badge="оценка"
          />
          <Tile label="Остаток на складе" value={formatNumber(product.stock)} note="точные данные" />
        </div>

        {/* Сигналы спроса — раздельно: популярность ≠ объём ≠ свежесть */}
        <DemandSignals product={product} className="mb-6" />

        {/* Score breakdown + niche comparison */}
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ScoreCard product={product} marketplace={marketplace} />
          <NicheComparisonCard product={product} />
        </div>

        {/* Price distribution (real snapshot) */}
        <PriceDistributionCard product={product} className="mb-6" />

        {/* Margin calculator */}
        <Card className="max-w-2xl">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Калькулятор маржи</CardTitle>
            <Badge variant="potential">
              <Info className="size-3" /> потенциал / прикидка
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <CalcField label={`Закупочная цена (${product.currency})`} value={purchase} onChange={setPurchase} />
              <CalcField label={`Логистика (${product.currency})`} value={logistics} onChange={setLogistics} />
              <CalcField label="Налог (%)" value={taxPct} onChange={setTaxPct} />
              <CalcField label="Эквайринг / прочее (%)" value={acquiringPct} onChange={setAcquiringPct} />
              <CalcField label={`Реклама на единицу (${product.currency})`} value={adPerUnit} onChange={setAdPerUnit} />
            </div>

            <div className="space-y-1.5 rounded-lg border border-border bg-muted/40 p-4 text-sm">
              <CalcLine label="Цена продажи" value={`+ ${formatMoney(product.price, product.currency)}`} />
              <CalcLine
                label={`Комиссия ${MARKETPLACES[marketplace].label} · ${product.category} (${commPct.toFixed(1)}%)`}
                value={`− ${formatMoney(calc.commissionAmt, product.currency)}`}
                negative
              />
              <CalcLine label="Логистика" value={`− ${formatMoney(calc.logistics, product.currency)}`} negative />
              <CalcLine
                label={`Налог (${(Number(taxPct) || 0).toFixed(1)}%)`}
                value={`− ${formatMoney(calc.taxAmt, product.currency)}`}
                negative
              />
              <CalcLine
                label={`Эквайринг / прочее (${(Number(acquiringPct) || 0).toFixed(1)}%)`}
                value={`− ${formatMoney(calc.acquiringAmt, product.currency)}`}
                negative
              />
              <CalcLine label="Реклама на единицу" value={`− ${formatMoney(calc.adNum, product.currency)}`} negative />
              <CalcLine label="Закупка" value={`− ${formatMoney(calc.purchaseNum, product.currency)}`} negative />
              <div className="my-2 border-t border-border" />
              <div className="flex items-center justify-between">
                <span className="font-semibold">Прибыль с единицы</span>
                <span
                  className={cn(
                    'text-base font-bold tabular-nums',
                    calc.profit >= 0 ? 'text-success' : 'text-destructive',
                  )}
                >
                  {formatMoney(calc.profit, product.currency)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <Metric label="Маржа" value={`${calc.marginPct.toFixed(1)}%`} negative={calc.marginPct < 0} />
                <Metric label="Наценка" value={`${calc.markupPct.toFixed(0)}%`} negative={calc.markupPct < 0} />
                <Metric label="ROI" value={`${calc.roiPct.toFixed(0)}%`} negative={calc.roiPct < 0} />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Расчёт — оценочный потенциал, а не гарантия. Комиссия — по категории «{product.category}» на{' '}
              {MARKETPLACES[marketplace].label} ({commPct.toFixed(1)}%). ROI = прибыль / закупка, наценка = (цена −
              закупка) / закупка.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Tile({
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
        <div className="mt-1.5 text-xl font-bold tabular-nums">{value}</div>
        <div className="mt-1.5">
          {variant ? (
            <Badge variant={variant}>
              <Info className="size-3" /> {badge}
            </Badge>
          ) : (
            <span className="text-[11px] text-muted-foreground">{note}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/** Поиск поставщика: редактируемый запрос + готовые ссылки на 1688 и Alibaba. */
function SupplierPanel({
  query,
  onChange,
  resetQuery,
}: {
  query: string
  onChange: (v: string) => void
  resetQuery: () => void
}) {
  const q = query.trim()
  const disabled = q.length === 0
  return (
    <Card className="mt-3 max-w-xl border-primary/30 bg-primary/5">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Search className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Поиск поставщика</h3>
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">Запрос для поиска (можно уточнить)</label>
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => onChange(e.target.value)}
              placeholder="например: чайник электрический"
            />
            <Button variant="ghost" size="sm" onClick={resetQuery} className="shrink-0">
              Сброс
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className={cn(disabled && 'pointer-events-none opacity-50')}>
            <a
              href={disabled ? undefined : SUPPLIER_1688(q)}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={disabled}
            >
              Найти на 1688 (опт, Китай) <ExternalLink className="size-3.5" />
            </a>
          </Button>
          <Button variant="outline" asChild className={cn(disabled && 'pointer-events-none opacity-50')}>
            <a
              href={disabled ? undefined : SUPPLIER_ALIBABA(q)}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={disabled}
            >
              Найти на Alibaba <ExternalLink className="size-3.5" />
            </a>
          </Button>
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Прямые цены поставщиков — в разработке. Пока — быстрый переход к поиску на оптовых площадках. Найденную
          закупочную цену подставьте в калькулятор маржи ниже.
        </p>
      </CardContent>
    </Card>
  )
}

function CalcField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs text-muted-foreground">{label}</label>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => {
          if (Number(e.target.value) < 0) onChange('0')
        }}
      />
    </div>
  )
}

function Metric({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-card p-2 text-center">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={cn('text-sm font-bold tabular-nums', negative ? 'text-destructive' : 'text-success')}>{value}</div>
    </div>
  )
}

function CalcLine({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`tabular-nums ${negative ? 'text-destructive' : 'text-foreground'}`}>{value}</span>
    </div>
  )
}

/** Сигналы спроса раздельно: популярность ≠ объём продаж ≠ оборачиваемость. */
function DemandSignals({ product, className }: { product: Product; className?: string }) {
  const signals = [
    {
      label: 'Популярность',
      value: product.popularity,
      hint: 'насколько «любят» товар — активность отзывов + рейтинг (может быть высокой даже при малых продажах)',
    },
    {
      label: 'Объём продаж',
      value: product.salesVolume,
      hint: 'абсолютные заказы за всё время (НЕ текущий тренд — товар мог продаваться давно)',
    },
    {
      label: 'Оборачиваемость',
      value: product.turnover,
      hint: 'заказы относительно остатка — высокая = быстро разлетается (горячий сейчас)',
    },
  ]
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Сигналы спроса</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {signals.map((s) => {
            const tone = s.value >= 60 ? 'bg-success' : s.value >= 35 ? 'bg-warning' : 'bg-muted-foreground/50'
            return (
              <div key={s.label}>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-sm font-medium">{s.label}</span>
                  <span className="text-sm font-semibold tabular-nums">{s.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className={cn('h-full rounded-full', tone)} style={{ width: `${s.value}%` }} />
                </div>
                <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{s.hint}</p>
              </div>
            )
          })}
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          Популярность и объём — разные вещи: товар может мало продаваться, но иметь высокую вовлечённость, и
          наоборот. Текущий рост/падение спроса точно покажет история продаж по дням (в разработке).
        </p>
      </CardContent>
    </Card>
  )
}

/** Факторы балла с человеческим объяснением реального числа за каждым. */
function factorRows(
  product: Product,
  marketplace: Marketplace,
  breakdown: { sales: number; demand: number; competition: number; revenue: number; margin: number; rating: number },
) {
  const compWord = product.competition === 'low' ? 'низкая' : product.competition === 'med' ? 'средняя' : 'высокая'
  const margin = estMarginPct(product.price, marketplace, product.category)
  return [
    {
      label: 'Ходовость',
      value: breakdown.sales,
      explain: `~${formatNumber(product.estSalesPerMonth)} продаж/мес (оценка)`,
    },
    {
      label: 'Спрос',
      value: breakdown.demand,
      explain: `${formatNumber(product.ordersTotal)} заказов, ${formatNumber(product.reviews)} отзывов (оценка)`,
    },
    {
      label: 'Конкуренция',
      value: breakdown.competition,
      explain: `${compWord}: ${formatNumber(product.leafProductAmount)} товаров в нише`,
    },
    {
      label: 'Выручка',
      value: breakdown.revenue,
      explain: `~${formatMoney(product.estRevenuePerMonth, product.currency)}/мес (оценка)`,
    },
    { label: 'Маржа', value: breakdown.margin, explain: `~${margin}% (потенциал)` },
    { label: 'Рейтинг', value: breakdown.rating, explain: `${product.rating.toFixed(1)} из 5` },
  ]
}

/** (a) Индекс привлекательности + разбивка факторов + уровень доверия (честно). */
function ScoreCard({ product, marketplace }: { product: Product; marketplace: Marketplace }) {
  const score = potentialScore(product, marketplace)
  const base = scoreBreakdown(product, marketplace)
  const breakdown = { ...base, rating: Math.round((product.rating / 5) * 100) }
  const tone = score >= 65 ? 'text-success' : score >= 45 ? 'text-warning' : 'text-muted-foreground'
  const trust = trustLevel(product)
  const trustVariant = trust.level === 'high' ? 'exact' : trust.level === 'med' ? 'potential' : 'outline'
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Индекс привлекательности</CardTitle>
        <Badge variant="potential">
          <Info className="size-3" /> оценка 0–100
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex items-baseline gap-2">
          <span className={cn('text-4xl font-bold tabular-nums', tone)}>{score}</span>
          <span className="text-sm text-muted-foreground">/ 100</span>
        </div>
        <div className="mb-4">
          <Badge variant={trustVariant}>
            <ShieldCheck className="size-3" /> Уровень доверия: {trust.label}
          </Badge>
          <p className="mt-1 text-[11px] text-muted-foreground">{trust.reason}</p>
        </div>
        <p className="mb-2 text-xs text-muted-foreground">
          Из чего складывается балл (0–100 по каждому фактору — насколько он хорош для продажи):
        </p>
        <div className="space-y-3">
          {factorRows(product, marketplace, breakdown).map((m) => {
            const barTone = m.value >= 65 ? 'bg-success' : m.value >= 45 ? 'bg-warning' : 'bg-primary'
            return (
              <div key={m.label}>
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span className="min-w-0">
                    <span className="font-medium">{m.label}</span>{' '}
                    <span className="text-muted-foreground">— {m.explain}</span>
                  </span>
                  <span className="shrink-0 tabular-nums font-medium">{m.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className={cn('h-full rounded-full transition-all', barTone)} style={{ width: `${m.value}%` }} />
                </div>
              </div>
            )
          })}
          {seasonAdjustment(product) !== 0 && (
            <div className="flex items-center justify-between rounded-md bg-muted/50 px-2.5 py-1.5 text-xs">
              <span className="font-medium">Сезонная поправка</span>
              <span className={cn('tabular-nums font-medium', seasonAdjustment(product) > 0 ? 'text-success' : 'text-destructive')}>
                {seasonAdjustment(product) > 0 ? '+' : ''}
                {seasonAdjustment(product)} к баллу
              </span>
            </div>
          )}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          Балл — взвешенная сумма факторов (спрос 30%, конкуренция 25%, выручка 30%, маржа 15%) + сезонная поправка. Не
          гарантия продаж; точный прогноз требует истории по дням. Цена/заказы/рейтинг — точно, спрос/выручка/маржа —
          оценка.
        </p>
      </CardContent>
    </Card>
  )
}

/** (b) Сравнение товара с нишей: цена / заказы / выручка vs средние по категории. */
function NicheComparisonCard({ product }: { product: Product }) {
  const stats = nicheStats(product.category, product.marketplace)
  if (!stats) return null
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Сравнение с нишей</CardTitle>
        <Badge variant={stats.competition}>{COMP_LABEL[stats.competition]}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <CompareRow label="Цена" value={formatMoney(product.price, product.currency)} delta={delta(product.price, stats.avgPrice)} baseLabel={`ср. ${formatMoney(stats.avgPrice, stats.currency)}`} />
        <CompareRow label="Заказов" value={formatNumber(product.ordersTotal)} delta={delta(product.ordersTotal, stats.medianOrders)} baseLabel={`медиана ${formatNumber(stats.medianOrders)}`} />
        <CompareRow label="Выручка/мес (оценка)" value={formatMoney(product.estRevenuePerMonth, product.currency)} delta={delta(product.estRevenuePerMonth, stats.avgRevenue)} baseLabel={`ср. ${formatMoney(stats.avgRevenue, stats.currency)}`} />
        <div className="border-t border-border pt-2 text-[11px] text-muted-foreground">
          Размер ниши: <span className="font-medium text-foreground">{formatNumber(stats.nicheSize)}</span> товаров
          в категории (реально). Дельта показана к среднему/медиане по категории.
        </div>
      </CardContent>
    </Card>
  )
}

/** % отклонение значения от базы; null если база 0. */
function delta(value: number, base: number): number | null {
  if (!base) return null
  return Math.round(((value - base) / base) * 100)
}

function CompareRow({ label, value, delta, baseLabel }: { label: string; value: string; delta: number | null; baseLabel: string }) {
  const up = delta !== null && delta > 0
  const down = delta !== null && delta < 0
  const Icon = up ? ArrowUp : down ? ArrowDown : Minus
  const tone = up ? 'text-success' : down ? 'text-destructive' : 'text-muted-foreground'
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[11px] text-muted-foreground">{baseLabel}</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold tabular-nums">{value}</div>
        {delta !== null && (
          <div className={cn('flex items-center justify-end gap-0.5 text-xs tabular-nums', tone)}>
            <Icon className="size-3" />
            {Math.abs(delta)}%
          </div>
        )}
      </div>
    </div>
  )
}

interface PriceBucket {
  label: string
  range: string
  count: number
  active: boolean
}

/** (c) Реальное распределение цен в нише (снимок), с подсветкой корзины этого товара. */
function PriceDistributionCard({ product, className }: { product: Product; className?: string }) {
  const buckets = useMemo<PriceBucket[]>(() => {
    const prices = productsFor(product.marketplace)
      .filter((p) => p.category === product.category)
      .map((p) => p.price)
    if (!prices.length) return []
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const N = 6
    const cur = product.currency
    if (max === min)
      return [{ label: formatNumber(min), range: formatMoney(min, cur), count: prices.length, active: true }]
    const step = (max - min) / N
    const out: PriceBucket[] = Array.from({ length: N }, (_, i) => {
      const lo = min + step * i
      const hi = i === N - 1 ? max : min + step * (i + 1)
      return {
        label: `${Math.round(lo / 1000)}–${Math.round(hi / 1000)}k`,
        range: `${formatMoney(Math.round(lo), cur)} – ${formatMoney(Math.round(hi), cur)}`,
        count: 0,
        active: false,
      }
    })
    const idxOf = (price: number) => Math.min(N - 1, Math.floor((price - min) / step))
    for (const pr of prices) out[idxOf(pr)].count++
    out[idxOf(product.price)].active = true
    return out
  }, [product])

  if (!buckets.length) return null

  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Распределение цен в нише (снимок)</CardTitle>
        <Badge variant="exact">
          <Info className="size-3" /> реально
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 208 }}>
            <AreaChart data={buckets} margin={{ top: 16, right: 8, left: -20, bottom: 4 }}>
              <defs>
                <linearGradient id="distFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={PRIMARY} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                stroke={AXIS}
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: GRID }}
                label={{ value: `цена, ${product.currency}`, position: 'insideBottom', offset: -2, fontSize: 10, fill: AXIS }}
                height={28}
              />
              <YAxis
                stroke={AXIS}
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={36}
                allowDecimals={false}
                label={{ value: 'товаров', angle: -90, position: 'insideLeft', fontSize: 10, fill: AXIS }}
              />
              <RechartTooltip content={<DistTooltip />} cursor={{ stroke: GRID }} />
              <Area
                type="monotone"
                dataKey="count"
                stroke={PRIMARY}
                strokeWidth={2}
                fill="url(#distFill)"
                isAnimationActive={false}
                dot={(props) => {
                  const active = buckets[props.index]?.active
                  return (
                    <circle
                      key={props.index}
                      cx={props.cx}
                      cy={props.cy}
                      r={active ? 5 : 3}
                      fill={active ? PRIMARY : 'hsl(var(--card))'}
                      stroke={PRIMARY}
                      strokeWidth={2}
                    />
                  )
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Сколько товаров ниши попадает в каждый ценовой диапазон. Подсвечена корзина, в которой находится этот товар.
        </p>
      </CardContent>
    </Card>
  )
}

interface DistPayload {
  value: number
  payload: PriceBucket
}
function DistTooltip({ active, payload }: { active?: boolean; payload?: DistPayload[] }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md">
      <div className="text-muted-foreground">{p.range}</div>
      <div className="font-medium tabular-nums">{formatNumber(p.count)} товаров</div>
      {p.active && <div className="mt-0.5 text-primary">← этот товар здесь</div>}
    </div>
  )
}
