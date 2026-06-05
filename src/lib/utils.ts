import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(n))
}

export function formatMoney(n: number, currency: string): string {
  return `${formatNumber(n)} ${currency}`
}
