import type { Message } from '@/screens/AiChat'
import { getProduct } from '@/lib/mockData'

/**
 * Реальная история чатов в localStorage. Каждый разговор сохраняется с сообщениями;
 * «Недавнее» в сайдбаре строится из реальных разговоров (заголовок = первый вопрос).
 */

const KEY = 'nisharadar.chats.v1'

export interface StoredMessage {
  id: number
  role: 'user' | 'assistant'
  text: string
  /** товары храним по id (пере-резолвятся при загрузке — данные могут обновиться) */
  productIds?: string[]
}

export interface Conversation {
  id: string
  title: string
  updatedAt: number
  messages: StoredMessage[]
}

export interface RecentChat {
  id: string
  title: string
}

function read(): Conversation[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw) as Conversation[]
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function write(list: Conversation[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50))) // кап на 50 разговоров
  } catch {
    // localStorage недоступен/переполнен — тихо игнорируем
  }
}

/** Список недавних разговоров для сайдбара (свежие сверху). */
export function listRecent(): RecentChat[] {
  return read()
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((c) => ({ id: c.id, title: c.title }))
}

/** Заголовок разговора = первый вопрос пользователя (обрезанный). */
function titleFrom(messages: Message[]): string {
  const firstUser = messages.find((m) => m.role === 'user')
  const t = (firstUser?.text || 'Новый чат').trim()
  return t.length > 42 ? t.slice(0, 42) + '…' : t
}

function toStored(messages: Message[]): StoredMessage[] {
  return messages.map((m) => ({
    id: m.id,
    role: m.role,
    text: m.text,
    productIds: (m.products ?? m.answer?.products)?.map((p) => p.id),
  }))
}

/** Восстановить сообщения разговора (товары пере-резолвятся по id). */
export function loadConversation(id: string): Message[] | null {
  const c = read().find((x) => x.id === id)
  if (!c) return null
  return c.messages.map((m) => {
    const products = m.productIds?.map((pid) => getProduct(pid)).filter((p): p is NonNullable<typeof p> => Boolean(p))
    return {
      id: m.id,
      role: m.role,
      text: m.text,
      products: products && products.length ? products : undefined,
    }
  })
}

/**
 * Сохранить/обновить разговор. Возвращает его id (создаёт новый при отсутствии).
 * Пустые разговоры (без сообщений) не сохраняются.
 */
export function saveConversation(convId: string | null, messages: Message[]): string | null {
  if (!messages.length) return convId
  const list = read()
  const id = convId ?? `c${Date.now()}`
  const conv: Conversation = {
    id,
    title: titleFrom(messages),
    updatedAt: Date.now(),
    messages: toStored(messages),
  }
  const idx = list.findIndex((c) => c.id === id)
  if (idx >= 0) list[idx] = conv
  else list.unshift(conv)
  write(list)
  return id
}

export function deleteConversation(id: string) {
  write(read().filter((c) => c.id !== id))
}
