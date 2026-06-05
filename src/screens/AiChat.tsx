import { useEffect, useRef, useState } from 'react'
import {
  ArrowUp,
  ArrowUpRight,
  DollarSign,
  Flame,
  Info,
  Layers,
  Mic,
  Plus,
  Radar,
  ShieldCheck,
  TrendingUp,
  X,
} from 'lucide-react'
import {
  MARKETPLACES,
  bestByPeriod,
  estMarginPct,
  getProduct,
  productsFor,
  type Marketplace,
  type Product,
} from '@/lib/mockData'
import { answer } from '@/lib/chatEngine'
import { aiChat, type ChatProduct } from '@/lib/aiClient'
import { MiniProductTable } from '@/components/MiniProductTable'
import type { ChatAnswer } from '@/lib/chatEngine'
import { Textarea } from '@/components/ui/Textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip'
import { cn } from '@/lib/utils'

interface Message {
  id: number
  role: 'user' | 'assistant'
  text: string
  answer?: ChatAnswer
  /** товары, выбранные ИИ для показа (путь Gemini) */
  products?: Product[]
}

interface Suggestion {
  icon: typeof TrendingUp
  label: string
  query: string
}

/* Минимальные типы Web Speech API (DOM-lib их не описывает). */
interface SpeechRecognitionResultLike {
  0: { transcript: string }
  isFinal: boolean
}
interface SpeechRecognitionEventLike {
  resultIndex: number
  results: { length: number; [i: number]: SpeechRecognitionResultLike }
}
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

const SUGGESTIONS: Suggestion[] = [
  { icon: DollarSign, label: 'Топ по выручке', query: 'Топ товаров по выручке' },
  { icon: ShieldCheck, label: 'Где низкая конкуренция', query: 'Где низкая конкуренция?' },
  { icon: TrendingUp, label: 'Лучшая маржа', query: 'У каких товаров лучшая маржа?' },
  { icon: Flame, label: 'Что в тренде', query: 'Что сейчас в тренде?' },
]

export function AiChat({
  marketplace,
  messages,
  setMessages,
  onOpenProduct,
  onOpenCategory,
}: {
  marketplace: Marketplace
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  onOpenProduct: (id: string) => void
  onOpenCategory: (category: string) => void
}) {
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const idRef = useRef(1)
  const endRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const isEmpty = messages.length === 0
  const speechSupported = useRef(getSpeechRecognitionCtor() !== null).current

  useEffect(() => {
    if (!isEmpty) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing, isEmpty])

  // авто-рост textarea
  function autoGrow() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }
  useEffect(autoGrow, [input])

  /** Локальный keyword-ответ (без ИИ). */
  function pushLocal(a: ReturnType<typeof answer>) {
    setMessages((m) => [
      ...m,
      { id: idRef.current++, role: 'assistant', text: a.text, answer: a.products || a.categories ? a : undefined },
    ])
  }

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || typing) return
    const hasPhoto = photo !== null
    const userMsg: Message = { id: idRef.current++, role: 'user', text: trimmed }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setPhoto(null)

    // 1) Сначала свой разбор вопроса (категория+период+критерий) — без ИИ, мгновенно.
    const local = answer(trimmed, marketplace, MARKETPLACES[marketplace].label)
    if (local.matched && !hasPhoto) {
      pushLocal(local)
      return
    }

    // 2) Не поняли (или есть фото) → передаём вопрос Gemini.
    setTyping(true)
    const catalog: ChatProduct[] = bestByPeriod('all', productsFor(marketplace)).map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      orders: p.ordersTotal,
      price: p.price,
      demand: p.demandProxy,
      margin: estMarginPct(p.price, marketplace, p.category),
    }))
    try {
      const { text: aiText, productIds, source } = await aiChat(trimmed, catalog, hasPhoto)
      if (source === 'ai' && aiText.trim()) {
        const products = productIds.map((id) => getProduct(id)).filter((p): p is Product => Boolean(p))
        setMessages((m) => [
          ...m,
          { id: idRef.current++, role: 'assistant', text: aiText, products: products.length ? products : undefined },
        ])
      } else {
        // ИИ недоступен (лимит) — отдаём подсказку как пользоваться.
        pushLocal({
          text:
            'Не совсем понял вопрос, а ИИ-разбор сейчас недоступен. Спросите конкретнее, например: «лучшие товары в бытовой технике», «топ по марже в косметике», «что в тренде», «где низкая конкуренция».',
          matched: true,
        })
      }
    } catch {
      pushLocal({
        text: 'ИИ-разбор временно недоступен. Спросите по-другому: «лучший товар в электронике», «топ по выручке за месяц».',
        matched: true,
      })
    } finally {
      setTyping(false)
    }
  }

  function onPickPhoto(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    if (photo) URL.revokeObjectURL(photo)
    setPhoto(URL.createObjectURL(file))
  }

  function clearPhoto() {
    if (photo) URL.revokeObjectURL(photo)
    setPhoto(null)
  }

  function toggleMic() {
    if (listening) {
      recognitionRef.current?.stop()
      return
    }
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) return
    const rec = new Ctor()
    rec.lang = 'ru-RU'
    rec.continuous = false
    rec.interimResults = true
    rec.onresult = (e) => {
      let transcript = ''
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript
      setInput(transcript)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recognitionRef.current = rec
    setListening(true)
    rec.start()
  }

  // остановить распознавание при размонтировании
  useEffect(() => () => recognitionRef.current?.stop(), [])

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  const composer = (
    <Composer
      ref={textareaRef}
      value={input}
      onChange={setInput}
      onKeyDown={onKeyDown}
      onSend={() => send(input)}
      disabled={typing}
      photo={photo}
      onAttachClick={() => fileRef.current?.click()}
      onRemovePhoto={clearPhoto}
      onMicClick={toggleMic}
      listening={listening}
      speechSupported={speechSupported}
    />
  )

  const fileInput = (
    <input
      ref={fileRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        onPickPhoto(e.target.files)
        e.target.value = ''
      }}
    />
  )

  if (isEmpty) {
    return (
      <div className="flex h-full flex-col">
        {fileInput}
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <div className="w-full max-w-2xl">
            <div className="mb-7 flex flex-col items-center text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Radar className="size-6" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-[2rem]">Что проанализируем сегодня?</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Спросите про ходовые товары, ниши и маржу на маркетплейсе{' '}
                <span className="font-medium text-foreground">{MARKETPLACES[marketplace].label}</span>.
              </p>
            </div>

            {composer}

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => send(s.query)}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-2 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground"
                >
                  <s.icon className="size-4 text-primary" />
                  {s.label}
                </button>
              ))}
            </div>

            <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <Info className="size-3.5" />
              Цена, рейтинг, отзывы и заказы — точные. Продажи, выручка и маржа — оценка.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {fileInput}
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
          {messages.map((m) =>
            m.role === 'user' ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl bg-bubble px-4 py-2.5 text-sm leading-relaxed">
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex gap-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Radar className="size-[18px]" />
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.text}</p>
                  {m.answer?.categories && m.answer.categories.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.answer.categories.map((c) => (
                        <button
                          key={c.category}
                          onClick={() => onOpenCategory(c.category)}
                          className="group inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Layers className="size-4 shrink-0 text-primary" />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium leading-tight">{c.category}</span>
                            <span className="block text-xs text-muted-foreground">{c.detail}</span>
                          </span>
                          <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                        </button>
                      ))}
                    </div>
                  )}
                  {(m.answer?.products || m.products) && (
                    <>
                      <MiniProductTable
                        products={m.products ?? m.answer!.products!}
                        marketplace={marketplace}
                        onOpenProduct={onOpenProduct}
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        Нажмите на товар, чтобы открыть карточку. Выручка/маржа — оценка по тарифам{' '}
                        {MARKETPLACES[marketplace].label}.
                      </p>
                    </>
                  )}
                </div>
              </div>
            ),
          )}

          {typing && (
            <div className="flex gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Radar className="size-[18px]" />
              </div>
              <div className="flex items-center gap-1.5 pt-2.5" aria-label="печатает">
                <Dot delay="0ms" />
                <Dot delay="150ms" />
                <Dot delay="300ms" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="border-t border-border bg-background/80 px-4 pb-4 pt-3 backdrop-blur">
        <div className="mx-auto max-w-3xl">
          {composer}
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Ответы строятся на данных {MARKETPLACES[marketplace].label} и могут быть сгенерированы ИИ (оценка, не
            гарантия).
          </p>
        </div>
      </div>
    </div>
  )
}

interface ComposerProps {
  value: string
  onChange: (v: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onSend: () => void
  disabled: boolean
  photo: string | null
  onAttachClick: () => void
  onRemovePhoto: () => void
  onMicClick: () => void
  listening: boolean
  speechSupported: boolean
}

function Composer({
  ref,
  value,
  onChange,
  onKeyDown,
  onSend,
  disabled,
  photo,
  onAttachClick,
  onRemovePhoto,
  onMicClick,
  listening,
  speechSupported,
}: ComposerProps & { ref: React.Ref<HTMLTextAreaElement> }) {
  const canSend = value.trim().length > 0 && !disabled
  const micButton = (
    <button
      type="button"
      aria-label={listening ? 'Остановить запись' : 'Голосовой ввод'}
      onClick={speechSupported ? onMicClick : undefined}
      disabled={!speechSupported}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        !speechSupported && 'cursor-not-allowed opacity-40',
        listening
          ? 'animate-pulse bg-destructive/15 text-destructive'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      <Mic className="size-5" />
    </button>
  )
  return (
    <div className="rounded-[1.75rem] border border-border bg-composer p-2 shadow-sm transition-colors focus-within:border-ring/60 focus-within:ring-2 focus-within:ring-ring/30">
      {photo && (
        <div className="mb-1.5 flex items-center gap-2 px-1">
          <div className="relative size-14 overflow-hidden rounded-lg border border-border">
            <img src={photo} alt="Вложение" className="size-full object-cover" />
            <button
              type="button"
              onClick={onRemovePhoto}
              aria-label="Убрать фото"
              className="absolute right-0.5 top-0.5 inline-flex size-5 items-center justify-center rounded-md bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="size-3" />
            </button>
          </div>
          <span className="text-xs text-muted-foreground">Фото прикреплено</span>
        </div>
      )}
      <div className="flex items-end gap-2">
        <button
          type="button"
          aria-label="Прикрепить фото"
          onClick={onAttachClick}
          className="mb-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-5" />
        </button>
        <Textarea
          ref={ref}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Спросите аналитику…"
          className="max-h-[200px] min-h-[24px] flex-1 resize-none border-0 bg-transparent px-1 py-2 text-[15px] leading-relaxed shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <div className="mb-0.5 flex shrink-0 items-center gap-1">
          {speechSupported ? (
            micButton
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>{micButton}</TooltipTrigger>
              <TooltipContent>Голосовой ввод не поддерживается</TooltipContent>
            </Tooltip>
          )}
          <button
            type="button"
            aria-label="Отправить"
            onClick={onSend}
            disabled={!canSend}
            className={cn(
              'inline-flex size-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              canSend
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground',
            )}
          >
            <ArrowUp className="size-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function Dot({ delay }: { delay: string }) {
  return <span className="typing-dot inline-block size-2 rounded-full bg-muted-foreground" style={{ animationDelay: delay }} />
}

export type { Message }
