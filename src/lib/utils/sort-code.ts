export function formatSortCode(sortCode: string): string {
  const digits = sortCode.replace(/\D/g, '')
  if (digits.length !== 6) return sortCode
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 6)}`
}

export function validateSortCode(sortCode: string): boolean {
  return /^\d{2}-\d{2}-\d{2}$/.test(sortCode)
}

export function parseSortCode(formatted: string): string {
  return formatted.replace(/-/g, '')
}
