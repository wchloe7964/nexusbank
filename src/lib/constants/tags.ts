export const presetTags = [
  { id: 'tax-deductible', label: 'Tax Deductible', bg: 'bg-emerald-500/10', color: 'text-emerald-600' },
  { id: 'reimbursable', label: 'Reimbursable', bg: 'bg-blue-500/10', color: 'text-blue-600' },
  { id: 'holiday', label: 'Holiday', bg: 'bg-amber-500/10', color: 'text-amber-600' },
  { id: 'gift', label: 'Gift', bg: 'bg-pink-500/10', color: 'text-pink-600' },
  { id: 'business', label: 'Business', bg: 'bg-purple-500/10', color: 'text-purple-600' },
  { id: 'split-bill', label: 'Split Bill', bg: 'bg-cyan-500/10', color: 'text-cyan-600' },
] as const

export function getTagColor(tag: string): string {
  const preset = presetTags.find(t => t.id === tag)
  return preset ? `${preset.bg} ${preset.color}` : 'bg-gray-500/10 text-gray-600'
}

export function getTagLabel(tag: string): string {
  const preset = presetTags.find(t => t.id === tag)
  return preset?.label ?? tag
}
