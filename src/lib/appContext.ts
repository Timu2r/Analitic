import { createContext, useContext } from 'react'
import type { Marketplace } from '@/lib/mockData'
import type { Message } from '@/screens/AiChat'
import type { RecentChat } from '@/lib/chatStore'

/** Разделяемое состояние приложения, живущее поверх роутинга (не сбрасывается при навигации). */
export interface AppState {
  marketplace: Marketplace
  setMarketplace: (m: Marketplace) => void
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  /** id текущего сохранённого разговора (null = новый, ещё не сохранён) */
  activeRecentId: string | null
  setActiveRecentId: (id: string | null) => void
  /** реальные недавние разговоры (из localStorage) */
  recents: RecentChat[]
  setRecents: React.Dispatch<React.SetStateAction<RecentChat[]>>
}

export const AppContext = createContext<AppState | null>(null)

export function useApp(): AppState {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppContext.Provider')
  return ctx
}
