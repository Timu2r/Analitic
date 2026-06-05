import { useMemo, useRef, useState } from 'react'
import {
  Check,
  Copy,
  Eye,
  ImagePlus,
  Info,
  ListChecks,
  PackageSearch,
  Search,
  Sparkles,
  Tag,
  Type,
  Wand2,
  X,
} from 'lucide-react'
import { categoriesFor, type Marketplace } from '@/lib/mockData'
import { CARD_STYLES, generateFromInput, type CardStyle, type GeneratedListing } from '@/lib/generationEngine'
import { aiGenerateListing } from '@/lib/aiClient'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

type ResultTab = 'titles' | 'description' | 'bullets' | 'attributes' | 'keywords' | 'images'

const RESULT_TABS: { value: ResultTab; label: string; icon: typeof Type }[] = [
  { value: 'titles', label: 'Названия', icon: Type },
  { value: 'description', label: 'Описание', icon: ListChecks },
  { value: 'bullets', label: 'Буллеты', icon: ListChecks },
  { value: 'attributes', label: 'Характеристики', icon: Tag },
  { value: 'keywords', label: 'SEO-ключи', icon: Search },
  { value: 'images', label: 'Изображения', icon: ImagePlus },
]

const MAX_PHOTOS = 3

export function CardGenerator({ marketplace }: { marketplace: Marketplace }) {
  const categories = useMemo(() => categoriesFor(marketplace), [marketplace])
  const [photos, setPhotos] = useState<string[]>([]) // object URLs
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [cardStyle, setCardStyle] = useState<CardStyle>('minimal')
  const [bgDescription, setBgDescription] = useState('')
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done'>('idle')
  const [listing, setListing] = useState<GeneratedListing | null>(null)
  const [source, setSource] = useState<'ai' | 'mock'>('mock')
  const [tab, setTab] = useState<ResultTab>('titles')
  const [editedDescription, setEditedDescription] = useState('')
  const [editedTitle, setEditedTitle] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const canGenerate = title.trim().length >= 2 && phase !== 'loading'

  function addFiles(files: FileList | null) {
    if (!files) return
    const room = MAX_PHOTOS - photos.length
    const next = Array.from(files)
      .slice(0, room)
      .map((f) => URL.createObjectURL(f))
    if (next.length) setPhotos((p) => [...p, ...next])
  }

  function removePhoto(i: number) {
    setPhotos((p) => {
      URL.revokeObjectURL(p[i])
      return p.filter((_, idx) => idx !== i)
    })
  }

  function applyResult(result: GeneratedListing, src: 'ai' | 'mock') {
    setListing(result)
    setSource(src)
    setEditedDescription(result.description)
    setEditedTitle(result.titles[0])
    setPhase('done')
    setTab('titles')
  }

  async function generate() {
    if (!canGenerate) return
    setPhase('loading')
    const styleLabel = CARD_STYLES.find((s) => s.value === cardStyle)?.label ?? cardStyle
    // Стиль и описание фона передаём в контекст названия, чтобы текст отражал тон оформления.
    const styleHints = [
      `Стиль оформления карточки: ${styleLabel}.`,
      bgDescription.trim() && `Атмосфера/фон: ${bgDescription.trim()}.`,
    ]
      .filter(Boolean)
      .join(' ')
    const titleArg = `${title.trim()} (${styleHints})`
    const bg = bgDescription.trim() || undefined
    try {
      const { listing: result, source: src } = await aiGenerateListing(titleArg, category || undefined)
      // ИИ-путь не строит проф-промпты картинок — дополняем их из движка по выбранному стилю.
      const withPrompts: GeneratedListing = {
        ...result,
        imagePrompts: generateFromInput(title.trim(), category, cardStyle, bg).imagePrompts,
      }
      applyResult(withPrompts, src)
    } catch {
      // сеть/прокси упали — не ломаем экран, отдаём локальный шаблон
      applyResult(generateFromInput(title.trim(), category, cardStyle, bg), 'mock')
    }
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10">
        <header className="mb-6">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Wand2 className="size-6 text-primary" />
            Генерация карточки
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Загрузите фото своего товара и укажите название — ИИ соберёт продающую карточку: SEO-название, описание,
            характеристики и ключевые слова.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Левая колонка: ввод селлера + результаты */}
          <div className="min-w-0 space-y-5">
            {/* Форма ввода */}
            <Card>
              <CardContent className="space-y-5 p-5">
                {/* Фото товара */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Фото товара <span className="text-muted-foreground">(до {MAX_PHOTOS})</span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {photos.map((src, i) => (
                      <div key={i} className="relative size-24 overflow-hidden rounded-lg border border-border">
                        <img src={src} alt={`Фото ${i + 1}`} className="size-full object-cover" />
                        <button
                          onClick={() => removePhoto(i)}
                          aria-label="Удалить фото"
                          className="absolute right-1 top-1 inline-flex size-6 items-center justify-center rounded-md bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                    {photos.length < MAX_PHOTOS && (
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="flex size-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <ImagePlus className="size-6" />
                        <span className="text-xs">Добавить</span>
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      addFiles(e.target.files)
                      e.target.value = ''
                    }}
                  />
                </div>

                {/* Название + категория */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Название товара</label>
                    <Input
                      placeholder="напр. Беспроводные наушники TWS"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') generate()
                      }}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Категория <span className="text-muted-foreground">(необяз.)</span>
                    </label>
                    <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full">
                      <option value="">Определить автоматически</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Стиль карточки + описание фона (для будущей генерации фото) */}
                <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <ImagePlus className="mt-0.5 size-4 shrink-0" />
                    <span>
                      Стиль и фон задают <strong className="text-foreground">проф-промпты для генерации фото</strong>{' '}
                      (вкладка «Изображения») и тон текста карточки. Подключите image-ИИ — промпты готовы.
                    </span>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Стиль карточки</label>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {CARD_STYLES.map((s) => {
                        const active = cardStyle === s.value
                        return (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => setCardStyle(s.value)}
                            aria-pressed={active}
                            className={cn(
                              'rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                              active
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:bg-accent',
                            )}
                          >
                            <div className={cn('text-sm font-medium', active ? 'text-primary' : 'text-foreground')}>
                              {s.label}
                            </div>
                            <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{s.desc}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Описание фона <span className="text-muted-foreground">(необяз.)</span>
                    </label>
                    <Textarea
                      placeholder="Освещение, цвета, атмосфера, детали…"
                      value={bgDescription}
                      onChange={(e) => setBgDescription(e.target.value)}
                      rows={2}
                      className="resize-y"
                    />
                  </div>
                </div>

                <Button size="lg" className="w-full sm:w-auto" onClick={generate} disabled={!canGenerate}>
                  <Sparkles />
                  {phase === 'done' ? 'Сгенерировать заново' : 'Сгенерировать карточку'}
                </Button>
                {title.trim().length > 0 && title.trim().length < 2 && (
                  <p className="text-xs text-destructive">Введите название товара.</p>
                )}
              </CardContent>
            </Card>

            {/* Результаты */}
            {phase === 'loading' && <LoadingResults />}

            {phase === 'done' && listing && (
              <>
                <div className="flex items-center justify-between gap-2">
                  {source === 'ai' ? (
                    <Badge variant="primary" className="px-2.5 py-1 text-xs">
                      <Sparkles className="size-3" /> Gemini
                    </Badge>
                  ) : (
                    <Badge variant="estimate" className="px-2.5 py-1 text-xs">
                      <Info className="size-3" /> шаблон (ИИ недоступен)
                    </Badge>
                  )}
                </div>

                <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs leading-relaxed text-warning">
                  <Info className="mt-0.5 size-4 shrink-0" />
                  <span>
                    Текст ниже — <strong>ИИ-черновик</strong>. Проверьте факты и отредактируйте под свой товар перед
                    публикацией.
                  </span>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <div className="flex flex-wrap gap-1 border-b border-border p-2">
                      {RESULT_TABS.map((t) => (
                        <button
                          key={t.value}
                          onClick={() => setTab(t.value)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            tab === t.value
                              ? 'bg-accent text-foreground'
                              : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                          )}
                        >
                          <t.icon className="size-4" />
                          {t.label}
                        </button>
                      ))}
                    </div>

                    <div className="p-5">
                      {tab === 'titles' && (
                        <TitlesTab titles={listing.titles} editedTitle={editedTitle} onPickTitle={setEditedTitle} />
                      )}
                      {tab === 'description' && (
                        <DescriptionTab value={editedDescription} onChange={setEditedDescription} />
                      )}
                      {tab === 'bullets' && <BulletsTab bullets={listing.bullets} />}
                      {tab === 'attributes' && <AttributesTab attributes={listing.attributes} />}
                      {tab === 'keywords' && <KeywordsTab keywords={listing.keywords} />}
                      {tab === 'images' && (
                        <ImagesTab
                          prompts={listing.imagePrompts}
                          styleLabel={CARD_STYLES.find((s) => s.value === cardStyle)?.label ?? cardStyle}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {phase === 'idle' && (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center">
                <Sparkles className="mx-auto mb-3 size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Загрузите фото и укажите название товара, затем нажмите «Сгенерировать карточку».
                </p>
              </div>
            )}
          </div>

          {/* Правая колонка: превью «как на витрине» */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <StorefrontPreview
              photo={photos[0]}
              title={phase === 'done' && editedTitle ? editedTitle : title || 'Название вашего товара'}
              isDraft={phase === 'done'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Вкладки результатов ───────────────────────────────────────────── */

function TitlesTab({
  titles,
  editedTitle,
  onPickTitle,
}: {
  titles: string[]
  editedTitle: string
  onPickTitle: (t: string) => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">3 варианта SEO-названия. Выбранный отражается в превью витрины.</p>
      {titles.map((title, i) => {
        const active = title === editedTitle
        return (
          <div
            key={i}
            className={cn(
              'rounded-lg border p-3 transition-colors',
              active ? 'border-primary/50 bg-primary/5' : 'border-border',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm leading-relaxed">{title}</p>
              <div className="flex shrink-0 items-center gap-1.5">
                <CopyButton text={title} />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className={cn('text-[11px] tabular-nums', title.length > 60 ? 'text-warning' : 'text-muted-foreground')}>
                {title.length} символов
              </span>
              <Button
                variant={active ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => onPickTitle(title)}
                disabled={active}
              >
                {active ? (
                  <>
                    <Check /> В превью
                  </>
                ) : (
                  'Выбрать для витрины'
                )}
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DescriptionTab({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Описание можно редактировать.</p>
        <CopyButton text={value} label="Копировать" />
      </div>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={7} className="resize-y leading-relaxed" />
      <span className="block text-right text-[11px] tabular-nums text-muted-foreground">{value.length} символов</span>
    </div>
  )
}

function BulletsTab({ bullets }: { bullets: string[] }) {
  const text = bullets.map((b) => `• ${b}`).join('\n')
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Ключевые преимущества для карточки.</p>
        <CopyButton text={text} label="Копировать все" />
      </div>
      <ul className="space-y-2">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2.5 rounded-lg border border-border p-3 text-sm leading-relaxed">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function AttributesTab({ attributes }: { attributes: { name: string; value: string }[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <tbody>
          {attributes.map((a, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0">
              <td className="w-1/3 bg-muted/40 px-4 py-2.5 font-medium text-muted-foreground">{a.name}</td>
              <td className="px-4 py-2.5">{a.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const DEMAND_VARIANT: Record<'высокий' | 'средний' | 'низкий', 'low' | 'med' | 'exact'> = {
  высокий: 'low',
  средний: 'med',
  низкий: 'exact',
}

function KeywordsTab({ keywords }: { keywords: { term: string; demand: 'высокий' | 'средний' | 'низкий' }[] }) {
  const text = keywords.map((k) => k.term).join(', ')
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">SEO-ключи по спросу: зелёный — высокий, янтарный — средний, серый — низкий.</p>
        <CopyButton text={text} label="Копировать все" />
      </div>
      <div className="flex flex-wrap gap-2">
        {keywords.map((k, i) => (
          <Badge key={i} variant={DEMAND_VARIANT[k.demand]} className="px-2.5 py-1 text-xs">
            {k.term}
            <span className="opacity-60">· {k.demand}</span>
          </Badge>
        ))}
      </div>
    </div>
  )
}

function ImagesTab({ prompts, styleLabel }: { prompts: string[]; styleLabel: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
        <span>
          Готовые промпты для генерации фото. Подключите image-ИИ{' '}
          <strong className="text-foreground">(Nano Banana и т.п.)</strong> — промпты уже оптимизированы под выбранный
          стиль <strong className="text-foreground">«{styleLabel}»</strong>. Сейчас их можно скопировать в любой
          генератор изображений.
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {prompts.map((prompt, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
              <div className="flex flex-col items-center gap-2 text-muted-foreground/60">
                <ImagePlus className="size-9" />
                <span className="text-xs font-medium">Кадр {i + 1}</span>
              </div>
              <Badge variant="outline" className="absolute left-2 top-2 bg-card/80 text-[11px] backdrop-blur">
                стиль: {styleLabel}
              </Badge>
            </div>
            <div className="relative">
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded bg-muted/50 p-2 pr-9 font-mono text-xs leading-relaxed text-foreground scrollbar-thin">
                {prompt}
              </pre>
              <span className="absolute right-1 top-1">
                <CopyButton text={prompt} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Превью «как на витрине» ───────────────────────────────────────── */

function StorefrontPreview({ photo, title, isDraft }: { photo?: string; title: string; isDraft: boolean }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Eye className="size-4 text-primary" />
        Превью карточки на витрине
      </div>
      <p className="text-xs text-muted-foreground">Так товар увидит покупатель на маркетплейсе.</p>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="relative">
          {photo ? (
            <img src={photo} alt={title} className="aspect-square w-full object-cover" />
          ) : (
            <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground/50">
              <ImagePlus className="size-10" />
              <span className="text-xs">Загрузите фото товара</span>
            </div>
          )}
          {isDraft && (
            <Badge variant="primary" className="absolute left-3 top-3 shadow-sm">
              <Sparkles className="size-3" /> ИИ-черновик
            </Badge>
          )}
        </div>
        <div className="space-y-2 p-4">
          <p className="line-clamp-3 text-sm font-medium leading-snug text-foreground">{title}</p>
          <Button className="mt-1 w-full" disabled>
            <PackageSearch /> В корзину
          </Button>
        </div>
      </div>
      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Info className="size-3.5 shrink-0" />
        Превью использует ваше фото и выбранное название из генерации.
      </p>
    </div>
  )
}

/* ── Вспомогательные ───────────────────────────────────────────────── */

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }
  return (
    <Button variant="outline" size="sm" onClick={copy} aria-label="Копировать">
      {copied ? <Check className="text-success" /> : <Copy />}
      {label ? (copied ? 'Скопировано' : label) : null}
    </Button>
  )
}

function LoadingResults() {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="size-4 animate-pulse text-primary" />
          Генерирую карточку…
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-24 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-28" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
