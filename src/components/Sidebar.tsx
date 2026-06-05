import {
  BarChart3,
  MessageSquarePlus,
  PanelLeftClose,
  PanelLeftOpen,
  Radar,
  Store,
  Wand2,
} from 'lucide-react'
import { MARKETPLACES, type Marketplace } from '@/lib/mockData'
import type { RecentChat } from '@/lib/chatStore'
import { loadProfile, initials } from '@/lib/profile'
import type { View } from '@/App'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { Separator } from '@/components/ui/Separator'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip'
import { cn } from '@/lib/utils'

interface SidebarProps {
  view: View
  marketplace: Marketplace
  recents: RecentChat[]
  activeRecentId: string | null
  collapsed: boolean
  onToggleCollapsed: () => void
  onNewChat: () => void
  onOpenChat: () => void
  onOpenSearch: () => void
  onOpenGenerate: () => void
  onOpenProfile: () => void
  onSelectRecent: (id: string) => void
  onSelectMarketplace: (m: Marketplace) => void
}

export function Sidebar({
  view,
  marketplace,
  recents,
  activeRecentId,
  collapsed,
  onToggleCollapsed,
  onNewChat,
  onOpenChat,
  onOpenSearch,
  onOpenGenerate,
  onOpenProfile,
  onSelectRecent,
  onSelectMarketplace,
}: SidebarProps) {
  const profile = loadProfile()
  if (collapsed) {
    return (
      <aside className="flex w-[60px] shrink-0 flex-col items-center gap-1 border-r border-border bg-sidebar py-3">
        <IconButton label="Развернуть меню" onClick={onToggleCollapsed}>
          <PanelLeftOpen className="size-5" />
        </IconButton>
        <Separator className="my-1 w-7" />
        <IconButton label="Новый чат" onClick={onNewChat}>
          <MessageSquarePlus className="size-5" />
        </IconButton>
        <IconButton label="ИИ-аналитик" active={view === 'chat'} onClick={onOpenChat}>
          <Radar className="size-5" />
        </IconButton>
        <IconButton label="Поиск ниши / Аналитика" active={view === 'search'} onClick={onOpenSearch}>
          <BarChart3 className="size-5" />
        </IconButton>
        <IconButton label="Генерация карточки" active={view === 'generate'} onClick={onOpenGenerate}>
          <Wand2 className="size-5" />
        </IconButton>
        <div className="mt-auto flex flex-col items-center gap-1">
          <ThemeToggle />
          <button onClick={onOpenProfile} aria-label="Профиль" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="size-8">
              <AvatarFallback>{initials(profile.name)}</AvatarFallback>
            </Avatar>
          </button>
        </div>
      </aside>
    )
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Brand + collapse */}
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2 px-1">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Radar className="size-[18px]" />
          </div>
          <span className="text-base font-semibold tracking-tight">НишаРадар</span>
        </div>
        <IconButton label="Свернуть меню" onClick={onToggleCollapsed}>
          <PanelLeftClose className="size-[18px]" />
        </IconButton>
      </div>

      {/* New chat */}
      <div className="px-3">
        <button
          onClick={onNewChat}
          className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MessageSquarePlus className="size-4" />
          Новый чат
        </button>
      </div>

      {/* Nav */}
      <nav className="mt-3 flex flex-col gap-0.5 px-3">
        <NavItem icon={Radar} label="ИИ-аналитик" active={view === 'chat'} onClick={onOpenChat} />
        <NavItem icon={BarChart3} label="Поиск ниши / Аналитика" active={view === 'search'} onClick={onOpenSearch} />
        <NavItem icon={Wand2} label="Генерация карточки" active={view === 'generate'} onClick={onOpenGenerate} />
      </nav>

      {/* Marketplace switcher */}
      <div className="mt-3 px-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Store className="size-4" />
              <span className="flex-1 text-left">
                Маркетплейс: <span className="font-medium text-foreground">{MARKETPLACES[marketplace].label}</span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuLabel>Маркетплейс (тарифы)</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.keys(MARKETPLACES) as Marketplace[]).map((m) => (
              <DropdownMenuItem key={m} onSelect={() => onSelectMarketplace(m)}>
                <Store />
                <span className="flex-1">{MARKETPLACES[m].label}</span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {(MARKETPLACES[m].commission * 100).toFixed(0)}%
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator className="mx-3 my-3 w-auto" />

      {/* Recent */}
      <div className="px-5 pb-1 text-xs font-medium text-muted-foreground">Недавнее</div>
      <ScrollArea className="min-h-0 flex-1 px-3">
        <div className="flex flex-col gap-0.5 pb-2">
          {recents.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              Здесь появятся ваши чаты. Задайте вопрос ИИ-аналитику.
            </p>
          )}
          {recents.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectRecent(c.id)}
              className={cn(
                'truncate rounded-lg px-3 py-2 text-left text-sm transition-colors',
                activeRecentId === c.id && view === 'chat'
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
              )}
            >
              {c.title}
            </button>
          ))}
        </div>
      </ScrollArea>

      <Separator className="mx-3 w-auto" />

      {/* Footer: theme + user */}
      <div className="flex items-center gap-2 p-3">
        <ThemeToggle />
        <button
          onClick={onOpenProfile}
          className={cn(
            'flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            view === 'profile' && 'bg-accent',
          )}
        >
          <Avatar>
            <AvatarFallback>{initials(profile.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-medium">{profile.name || 'Профиль'}</div>
            <div className="truncate text-xs text-muted-foreground">Тариф {profile.plan}</div>
          </div>
        </button>
      </div>
    </aside>
  )
}

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Radar
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  )
}

function IconButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          className={cn(
            'inline-flex size-9 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}
