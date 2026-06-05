import { ChevronRight } from 'lucide-react'
import { estMarginPct, type Marketplace, type Product } from '@/lib/mockData'
import { ProductThumb } from '@/components/ProductThumb'
import { formatMoney, formatNumber } from '@/lib/utils'

/** Компактная мини-таблица товаров внутри ответа ИИ. Клик по строке открывает карточку. */
export function MiniProductTable({
  products,
  marketplace,
  onOpenProduct,
}: {
  products: Product[]
  marketplace: Marketplace
  onOpenProduct: (id: string) => void
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card">
      {products.map((p, i) => {
        const margin = estMarginPct(p.price, marketplace, p.category)
        return (
          <button
            key={p.id}
            onClick={() => onOpenProduct(p.id)}
            className={cnRow(i)}
          >
            <ProductThumb
              src={p.image}
              alt={p.title}
              className="size-10 shrink-0 rounded-md border border-border"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{p.title}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                <span>{p.category}</span>
                <span className="text-border">·</span>
                <span className="tabular-nums">{formatNumber(p.ordersTotal)} заказов</span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-sm font-semibold tabular-nums">{formatMoney(p.price, p.currency)}</div>
              <div
                className={
                  'mt-0.5 text-[11px] font-medium tabular-nums ' +
                  (margin >= 25 ? 'text-success' : margin >= 12 ? 'text-muted-foreground' : 'text-muted-foreground/60')
                }
              >
                маржа ~{margin}%
              </div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
        )
      })}
    </div>
  )
}

function cnRow(i: number): string {
  return [
    'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/60',
    i > 0 ? 'border-t border-border' : '',
  ].join(' ')
}
