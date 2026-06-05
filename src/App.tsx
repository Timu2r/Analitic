import { useEffect, useRef, useState } from 'react'
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { type Marketplace } from '@/lib/mockData'
import {
  listRecent,
  loadConversation,
  saveConversation,
  type RecentChat,
} from '@/lib/chatStore'
import { loadProfile } from '@/lib/profile'
import { AppContext, useApp } from '@/lib/appContext'
import { Sidebar } from '@/components/Sidebar'
import { TooltipProvider } from '@/components/ui/Tooltip'
import { NicheSearch } from '@/screens/NicheSearch'
import { ProductDetail } from '@/screens/ProductDetail'
import { CardGenerator } from '@/screens/CardGenerator'
import { Profile } from '@/screens/Profile'
import { AiChat, type Message } from '@/screens/AiChat'

/** Тип экрана для подсветки в сайдбаре (выводится из URL). */
export type View = 'chat' | 'search' | 'product' | 'generate' | 'profile'

function viewFromPath(pathname: string): View {
  if (pathname.startsWith('/categories') || pathname.startsWith('/search')) return 'search'
  if (pathname.startsWith('/product')) return 'product'
  if (pathname.startsWith('/generate')) return 'generate'
  if (pathname.startsWith('/profile')) return 'profile'
  return 'chat'
}

export default function App() {
  const [marketplace, setMarketplace] = useState<Marketplace>(() => loadProfile().defaultMarketplace)
  const [messages, setMessages] = useState<Message[]>([])
  const [activeRecentId, setActiveRecentId] = useState<string | null>(null)
  const [recents, setRecents] = useState<RecentChat[]>(() => listRecent())
  // не сохранять при первичной загрузке/восстановлении (только при реальных изменениях)
  const skipSave = useRef(true)

  // Автосохранение текущего разговора в localStorage при изменении сообщений.
  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    if (!messages.length) return
    const id = saveConversation(activeRecentId, messages)
    if (id && id !== activeRecentId) setActiveRecentId(id)
    setRecents(listRecent())
  }, [messages, activeRecentId])

  return (
    <AppContext.Provider
      value={{ marketplace, setMarketplace, messages, setMessages, activeRecentId, setActiveRecentId, recents, setRecents }}
    >
      <TooltipProvider delayDuration={250}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/chat" replace />} />
            <Route path="chat" element={<ChatRoute />} />
            <Route path="categories" element={<Navigate to="/search" replace />} />
            <Route path="search" element={<SearchRoute />} />
            <Route path="product/:id" element={<ProductRoute />} />
            <Route path="generate" element={<GenerateRoute />} />
            <Route path="profile" element={<ProfileRoute />} />
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Route>
        </Routes>
      </TooltipProvider>
    </AppContext.Provider>
  )
}

/** Каркас: сайдбар + область экрана. Состояние навигации завязано на URL. */
function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const view = viewFromPath(location.pathname)
  const { marketplace, setMarketplace, setMessages, activeRecentId, setActiveRecentId, recents } = useApp()
  const [collapsed, setCollapsed] = useState(false)

  function newChat() {
    setMessages([])
    setActiveRecentId(null)
    navigate('/chat')
  }

  function selectRecent(id: string) {
    const restored = loadConversation(id)
    setActiveRecentId(id)
    setMessages(restored ?? [])
    navigate('/chat')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        view={view}
        marketplace={marketplace}
        recents={recents}
        activeRecentId={activeRecentId}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        onNewChat={newChat}
        onOpenChat={() => navigate('/chat')}
        onOpenSearch={() => navigate('/search')}
        onOpenGenerate={() => navigate('/generate')}
        onOpenProfile={() => navigate('/profile')}
        onSelectRecent={selectRecent}
        onSelectMarketplace={setMarketplace}
      />
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}

function ChatRoute() {
  const navigate = useNavigate()
  const { marketplace, messages, setMessages } = useApp()
  return (
    <AiChat
      marketplace={marketplace}
      messages={messages}
      setMessages={setMessages}
      onOpenProduct={(id) => navigate(`/product/${id}`)}
      onOpenCategory={(cat) => navigate(`/search?tab=products&category=${encodeURIComponent(cat)}`)}
    />
  )
}

function SearchRoute() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { marketplace } = useApp()
  const category = searchParams.get('category') ?? undefined
  const tab = (searchParams.get('tab') as 'products' | 'categories' | null) ?? undefined
  return (
    <NicheSearch
      marketplace={marketplace}
      urlCategory={category}
      urlTab={tab}
      onSyncUrl={(next) => setSearchParams(next, { replace: true })}
      onOpenProduct={(id) => navigate(`/product/${id}`)}
    />
  )
}

function ProductRoute() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { marketplace } = useApp()
  if (!id) return <Navigate to="/search" replace />
  // Назад = в браузерную историю (вернёт к той же отфильтрованной выборке/категории, откуда пришли).
  return <ProductDetail productId={id} marketplace={marketplace} onBack={() => navigate(-1)} />
}

function GenerateRoute() {
  const { marketplace } = useApp()
  return <CardGenerator marketplace={marketplace} />
}

function ProfileRoute() {
  const { setMarketplace } = useApp()
  return <Profile onMarketplaceChange={setMarketplace} />
}
