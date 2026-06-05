import { useMemo, useState } from 'react'
import {
  Armchair,
  Baby,
  Book,
  Car,
  ChevronRight,
  Dumbbell,
  Footprints,
  HeartPulse,
  Info,
  Layers,
  PencilRuler,
  Shirt,
  Smartphone,
  Sparkles,
  SprayCan,
  Watch,
  Wrench,
  Apple,
  type LucideIcon,
} from 'lucide-react'
import {
  categoriesFor,
  nicheStats,
  type Competition,
  type Marketplace,
  type NicheStats,
} from '@/lib/mockData'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { formatMoney, formatNumber } from '@/lib/utils'

const COMP_LABEL: Record<Competition, string> = { low: 'низкая', med: 'средняя', high: 'высокая' }

/** Сетка карточек категорий. Клик по карточке → переход к товарам ниши. */
/** Иконка под категорию (по ключевым словам в названии). */
const CATEGORY_ICONS: { match: RegExp; icon: LucideIcon }[] = [
  { match: /электрон|техник/i, icon: Smartphone },
  { match: /бытовая техника/i, icon: Smartphone },
  { match: /красот|уход/i, icon: Sparkles },
  { match: /одежд/i, icon: Shirt },
  { match: /обув/i, icon: Footprints },
  { match: /книг/i, icon: Book },
  { match: /авто/i, icon: Car },
  { match: /дом|мебел/i, icon: Armchair },
  { match: /дет/i, icon: Baby },
  { match: /спорт/i, icon: Dumbbell },
  { match: /здоров/i, icon: HeartPulse },
  { match: /хими/i, icon: SprayCan },
  { match: /канц/i, icon: PencilRuler },
  { match: /строит|ремонт/i, icon: Wrench },
  { match: /аксессуар/i, icon: Watch },
  { match: /продукт|питани|еда/i, icon: Apple },
]

function iconForCategory(category: string): LucideIcon {
  return CATEGORY_ICONS.find((c) => c.match.test(category))?.icon ?? Layers
}

type CatSort = 'analyzed' | 'nicheSize' | 'avgRevenue' | 'avgPrice' | 'concentration' | 'competition'

const CAT_SORTS: { value: CatSort; label: string }[] = [
  { value: 'analyzed', label: 'Проанализировано товаров' },
  { value: 'avgRevenue', label: 'Ср. выручка (оценка)' },
  { value: 'nicheSize', label: 'Размер ниши' },
  { value: 'avgPrice', label: 'Средняя цена' },
  { value: 'concentration', label: 'Концентрация топ-3' },
  { value: 'competition', label: 'Конкуренция (низкая→)' },
]

const COMP_RANK: Record<NicheStats['competition'], number> = { low: 3, med: 2, high: 1 }

function catSortValue(s: NicheStats, key: CatSort): number {
  switch (key) {
    case 'analyzed':
      return s.productsInPool
    case 'nicheSize':
      return s.nicheSize
    case 'avgRevenue':
      return s.avgRevenue
    case 'avgPrice':
      return s.avgPrice
    case 'concentration':
      return s.top3RevenueShare
    case 'competition':
      return COMP_RANK[s.competition]
  }
}

export function CategoryGrid({
  marketplace,
  onOpenCategory,
}: {
  marketplace: Marketplace
  onOpenCategory: (category: string) => void
}) {
  const [sort, setSort] = useState<CatSort>('analyzed')
  const stats = useMemo(() => {
    const list = categoriesFor(marketplace)
      .map((c) => nicheStats(c, marketplace))
      .filter((s): s is NicheStats => Boolean(s))
    return list.sort((a, b) => catSortValue(b, sort) - catSortValue(a, sort))
  }, [marketplace, sort])

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Выберите категорию, чтобы посмотреть лучшие товары ниши: насыщенность, средние цены, оценку выручки и
          концентрацию у лидеров.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Сортировка:</span>
          <Select value={sort} onChange={(e) => setSort(e.target.value as CatSort)} className="w-auto">
            {CAT_SORTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <NicheCard key={s.category} stats={s} onClick={() => onOpenCategory(s.category)} />
        ))}
      </div>
      <p className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Info className="size-3.5 shrink-0" />
        Размер ниши, цены и заказы — точные данные с витрины. Выручка и концентрация — оценка.
      </p>
    </div>
  )
}

function NicheCard({ stats, onClick }: { stats: NicheStats; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col rounded-xl border border-border bg-card p-5 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {(() => {
              const Icon = iconForCategory(stats.category)
              return <Icon className="size-[18px]" />
            })()}
          </div>
          <h2 className="truncate text-base font-semibold leading-tight">{stats.category}</h2>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Metric label="Товаров в выборке" value={`${stats.productsInPool} / ${formatNumber(stats.nicheSize)}`} />
        <Metric label="Средняя цена" value={formatMoney(stats.avgPrice, stats.currency)} />
        <Metric label="Ср. выручка/мес" value={formatMoney(stats.avgRevenue, stats.currency)} estimate />
        <Metric label="Концентрация топ-3" value={`${stats.top3RevenueShare}%`} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="text-xs text-muted-foreground">Конкуренция</span>
        <Badge variant={stats.competition}>{COMP_LABEL[stats.competition]}</Badge>
      </div>
    </button>
  )
}

function Metric({ label, value, estimate }: { label: string; value: string; estimate?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-bold tabular-nums">{value}</div>
      {estimate && <Badge variant="estimate">оценка</Badge>}
    </div>
  )
}
