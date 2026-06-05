import { useState } from 'react'
import { Check, MessagesSquare, Moon, Sun, User } from 'lucide-react'
import { MARKETPLACES, type Marketplace } from '@/lib/mockData'
import { loadProfile, saveProfile, initials, type Profile as ProfileData } from '@/lib/profile'
import { listRecent } from '@/lib/chatStore'
import { useTheme } from '@/lib/theme'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

export function Profile({ onMarketplaceChange }: { onMarketplaceChange: (m: Marketplace) => void }) {
  const [profile, setProfile] = useState<ProfileData>(() => loadProfile())
  const [saved, setSaved] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const chatsCount = listRecent().length

  function update<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setProfile((p) => ({ ...p, [key]: value }))
    setSaved(false)
  }

  function save() {
    saveProfile(profile)
    onMarketplaceChange(profile.defaultMarketplace)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-2xl px-6 py-8 lg:px-10">
        <header className="mb-6 flex items-center gap-4">
          <Avatar className="size-14 text-lg">
            <AvatarFallback>{initials(profile.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{profile.name || 'Профиль'}</h1>
            <p className="text-sm text-muted-foreground">Тариф {profile.plan}</p>
          </div>
        </header>

        {/* Профиль */}
        <Card className="mb-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-4 text-primary" /> Профиль
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Имя</label>
              <Input value={profile.name} onChange={(e) => update('name', e.target.value)} placeholder="Ваше имя" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Маркетплейс по умолчанию</label>
              <Select
                value={profile.defaultMarketplace}
                onChange={(e) => update('defaultMarketplace', e.target.value as Marketplace)}
                className="w-full"
              >
                {(Object.keys(MARKETPLACES) as Marketplace[]).map((m) => (
                  <option key={m} value={m}>
                    {MARKETPLACES[m].label}
                  </option>
                ))}
              </Select>
            </div>
            <Button onClick={save}>
              {saved ? (
                <>
                  <Check /> Сохранено
                </>
              ) : (
                'Сохранить'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Внешний вид */}
        <Card className="mb-5">
          <CardHeader>
            <CardTitle>Внешний вид</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Тема</div>
                <div className="text-xs text-muted-foreground">Светлая или тёмная</div>
              </div>
              <Button variant="outline" onClick={toggleTheme}>
                {theme === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />}
                {theme === 'dark' ? 'Тёмная' : 'Светлая'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Статистика */}
        <Card className="mb-5">
          <CardHeader>
            <CardTitle>Статистика</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Stat icon={MessagesSquare} label="Чатов с аналитиком" value={String(chatsCount)} />
              <Stat icon={User} label="Тариф" value={profile.plan} />
            </div>
          </CardContent>
        </Card>

        {/* Тариф (заглушка) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Тариф
              <Badge variant="outline">{profile.plan}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Сейчас вы на бесплатном тарифе. Платные тарифы (больше анализов ИИ, история по дням, алерты) — в разработке.
            </p>
            <Button variant="outline" disabled>
              Перейти на Pro — скоро
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className={cn('rounded-lg border border-border bg-muted/30 p-4')}>
      <Icon className="mb-2 size-4 text-primary" />
      <div className="text-xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
