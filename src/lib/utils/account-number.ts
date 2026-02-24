export function formatAccountNumber(accountNumber: string): string {
  return accountNumber.replace(/(\d{4})(\d{4})/, '$1 $2')
}

export function maskAccountNumber(accountNumber: string): string {
  return `****${accountNumber.slice(-4)}`
}

export function validateAccountNumber(accountNumber: string): boolean {
  return /^\d{8}$/.test(accountNumber)
}
