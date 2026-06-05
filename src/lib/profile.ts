import type { Marketplace } from '@/lib/mockData'

/** Профиль пользователя (прототип, без реальной авторизации). Хранится в localStorage. */

const KEY = 'nisharadar.profile.v1'

export interface Profile {
  name: string
  defaultMarketplace: Marketplace
  plan: string
}

const DEFAULT: Profile = {
  name: 'Селлер',
  defaultMarketplace: 'uzum',
  plan: 'Free',
}

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT
    return { ...DEFAULT, ...(JSON.parse(raw) as Partial<Profile>) }
  } catch {
    return DEFAULT
  }
}

export function saveProfile(p: Profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    // localStorage недоступен — игнорируем
  }
}

/** Инициалы для аватара. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'С'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}
