import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
import { enGB } from 'date-fns/locale'

export function formatUKDate(date: Date | string): string {
  return format(new Date(date), 'dd/MM/yyyy', { locale: enGB })
}

export function formatUKDateTime(date: Date | string): string {
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: enGB })
}

export function formatRelativeTime(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: enGB })
}

export function formatTransactionDate(date: Date | string): string {
  const d = new Date(date)
  if (isToday(d)) return `Today, ${format(d, 'HH:mm')}`
  if (isYesterday(d)) return `Yesterday, ${format(d, 'HH:mm')}`
  return format(d, 'dd MMM yyyy', { locale: enGB })
}

export function formatMonthYear(date: Date | string): string {
  return format(new Date(date), 'MMMM yyyy', { locale: enGB })
}
