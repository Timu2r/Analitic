import { useState } from 'react'
import { AlertTriangle, Check, Info, Lightbulb, Sparkles, Wand2 } from 'lucide-react'
import { aiAnalyzeProduct, type ProductAnalysis } from '@/lib/aiClient'
import type { Product } from '@/lib/mockData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

export type AnalysisState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; analysis: ProductAnalysis; source: 'ai' | 'mock' }
  | { status: 'error' }

/** Хук: состояние анализа + запуск. Триггер можно держать снаружи (в шапке товара). */
export function useProductAnalysis(product: Product) {
  const [state, setState] = useState<AnalysisState>({ status: 'idle' })
  async function run() {
    setState({ status: 'loading' })
    try {
      const { analysis, source } = await aiAnalyzeProduct({
        title: product.title,
        category: product.category,
        rating: product.rating,
        reviews: product.reviews,
        orders: product.ordersTotal,
      })
      setState({ status: 'done', analysis, source })
    } catch {
      setState({ status: 'error' })
    }
  }
  return { state, run }
}

/**
 * Блок «Анализ товара (ИИ)». Управляемый: состояние/запуск приходят снаружи,
 * чтобы кнопку запуска можно было поставить в шапку товара рядом с «Найти поставщика».
 * Пока анализ не запущен (idle) — ничего не рендерит (триггер живёт в шапке).
 */
export function ProductAnalysisCard({ state, onRun }: { state: AnalysisState; onRun: () => void }) {
  if (state.status === 'idle') return null

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" /> Анализ товара (ИИ)
        </CardTitle>
        {state.status === 'done' && (
          <Badge variant={state.source === 'ai' ? 'potential' : 'exact'}>
            {state.source === 'ai' ? (
              <>
                <Sparkles className="size-3" /> Gemini
              </>
            ) : (
              <>
                <Info className="size-3" /> эвристика (ИИ недоступен)
              </>
            )}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {state.status === 'loading' && (
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-2.5 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-6 w-1/2" />
          </div>
        )}

        {state.status === 'error' && (
          <div className="flex flex-col items-start gap-3">
            <p className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="size-4" /> Не удалось проанализировать. Попробуйте ещё раз.
            </p>
            <Button variant="outline" onClick={onRun}>
              <Wand2 /> Повторить
            </Button>
          </div>
        )}

        {state.status === 'done' && <Result analysis={state.analysis} />}
      </CardContent>
    </Card>
  )
}

function Result({ analysis }: { analysis: ProductAnalysis }) {
  const score = Math.max(0, Math.min(100, Math.round(analysis.listingScore)))
  const barTone = score >= 65 ? 'bg-success' : score >= 45 ? 'bg-warning' : 'bg-muted-foreground/50'
  const scoreTone = score >= 65 ? 'text-success' : score >= 45 ? 'text-warning' : 'text-muted-foreground'

  return (
    <div className="space-y-6">
      {/* Качество листинга */}
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="text-sm font-semibold">Качество листинга</h3>
          <span className={cn('text-2xl font-bold tabular-nums', scoreTone)}>
            {score}
            <span className="text-sm font-normal text-muted-foreground"> / 100</span>
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
          <div className={cn('h-full rounded-full transition-all', barTone)} style={{ width: `${score}%` }} />
        </div>
        {analysis.listingTips.length > 0 && (
          <div className="mt-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Lightbulb className="size-3.5" /> Как улучшить
            </div>
            <ul className="space-y-1.5">
              {analysis.listingTips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Анализ отзывов */}
      <section className="border-t border-border pt-4">
        <h3 className="mb-2 text-sm font-semibold">Анализ отзывов</h3>
        {analysis.reviewSummary && (
          <p className="mb-3 text-sm text-muted-foreground">{analysis.reviewSummary}</p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 text-xs font-medium text-success">Плюсы</div>
            <ul className="space-y-1.5">
              {analysis.reviewPros.length ? (
                analysis.reviewPros.map((it, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" />
                    <span>{it}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">—</li>
              )}
            </ul>
          </div>
          <div>
            <div className="mb-1.5 text-xs font-medium text-warning">Минусы</div>
            <ul className="space-y-1.5">
              {analysis.reviewCons.length ? (
                analysis.reviewCons.map((it, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                    <span>{it}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">—</li>
              )}
            </ul>
          </div>
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          Разбор отзывов — <strong className="font-medium">оценка</strong> по рейтингу и числу отзывов: текстов отзывов на
          витрине Uzum пока нет.
        </p>
      </section>

      {/* Поисковые ключи */}
      {analysis.keywords.length > 0 && (
        <section className="border-t border-border pt-4">
          <h3 className="mb-2 text-sm font-semibold">Поисковые ключи (по каким находят)</h3>
          <div className="flex flex-wrap gap-1.5">
            {analysis.keywords.map((kw, i) => (
              <Badge key={i} variant="outline">
                {kw}
              </Badge>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
