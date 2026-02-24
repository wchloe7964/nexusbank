'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { formatGBP } from '@/lib/utils/currency'
import { formatTransactionDate } from '@/lib/utils/dates'
import { transactionCategories, type TransactionCategory } from '@/lib/constants/categories'
import { presetTags, getTagColor, getTagLabel } from '@/lib/constants/tags'
import { Search, Download, ArrowUpRight, ArrowDownLeft, ShieldAlert, StickyNote, X, Tag, Plus, Pencil, RotateCcw } from 'lucide-react'
import type { Transaction, Account } from '@/lib/types'
import { createDispute } from '@/app/(dashboard)/disputes/actions'
import { saveTransactionNote, deleteTransactionNote } from './note-actions'
import { updateTransactionCategory, resetTransactionCategory } from './category-actions'

interface NoteRecord {
  id: string
  note: string | null
  tags: string[]
  updated_at: string
}

interface TransactionsClientProps {
  initialTransactions: Transaction[]
  accounts: Account[]
  initialNotes: Record<string, NoteRecord>
  allTags: string[]
}

export default function TransactionsClient({ initialTransactions, accounts, initialNotes, allTags }: TransactionsClientProps) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [accountFilter, setAccountFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')

  // Dispute state
  const [disputeTransaction, setDisputeTransaction] = useState<Transaction | null>(null)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeDescription, setDisputeDescription] = useState('')
  const [disputeError, setDisputeError] = useState('')
  const [disputeSuccess, setDisputeSuccess] = useState(false)
  const [isDisputing, startDisputeTransition] = useTransition()

  // Notes state
  const [notes, setNotes] = useState<Record<string, NoteRecord>>(initialNotes)
  const [noteTransaction, setNoteTransaction] = useState<Transaction | null>(null)
  const [noteText, setNoteText] = useState('')
  const [noteTags, setNoteTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')
  const [noteError, setNoteError] = useState('')
  const [isSavingNote, startNoteTransition] = useTransition()

  // Category edit state
  const [transactions, setTransactions] = useState(initialTransactions)
  const [categoryEditTx, setCategoryEditTx] = useState<Transaction | null>(null)
  const [categoryError, setCategoryError] = useState('')
  const [isSavingCategory, startCategoryTransition] = useTransition()

  const filtered = transactions.filter((tx) => {
    if (search && !tx.description.toLowerCase().includes(search.toLowerCase()) && !tx.counterparty_name?.toLowerCase().includes(search.toLowerCase())) return false
    if (categoryFilter && tx.category !== categoryFilter) return false
    if (typeFilter && tx.type !== typeFilter) return false
    if (accountFilter && tx.account_id !== accountFilter) return false
    if (tagFilter) {
      const txNote = notes[tx.id]
      if (!txNote || !txNote.tags.includes(tagFilter)) return false
    }
    return true
  })

  // Collect unique tags from notes + allTags prop
  const availableTags = Array.from(new Set([...allTags, ...Object.values(notes).flatMap(n => n.tags)])).sort()

  function handleDisputeSubmit() {
    if (!disputeReason) {
      setDisputeError('Please select a reason')
      return
    }
    setDisputeError('')
    startDisputeTransition(async () => {
      try {
        await createDispute({
          transactionId: disputeTransaction!.id,
          reason: disputeReason,
          description: disputeDescription || undefined,
        })
        setDisputeSuccess(true)
        setTimeout(() => {
          setDisputeTransaction(null)
          setDisputeReason('')
          setDisputeDescription('')
          setDisputeSuccess(false)
        }, 2000)
      } catch (e) {
        setDisputeError(e instanceof Error ? e.message : 'Failed to file dispute')
      }
    })
  }

  function openNoteDialog(tx: Transaction) {
    const existing = notes[tx.id]
    setNoteTransaction(tx)
    setNoteText(existing?.note || '')
    setNoteTags(existing?.tags || [])
    setCustomTag('')
    setNoteError('')
  }

  function toggleTag(tag: string) {
    setNoteTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : prev.length < 10 ? [...prev, tag] : prev)
  }

  function addCustomTag() {
    const tag = customTag.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
    if (tag && !noteTags.includes(tag) && noteTags.length < 10) {
      setNoteTags(prev => [...prev, tag])
      setCustomTag('')
    }
  }

  function handleSaveNote() {
    setNoteError('')
    startNoteTransition(async () => {
      try {
        await saveTransactionNote({
          transactionId: noteTransaction!.id,
          note: noteText || undefined,
          tags: noteTags,
        })
        // Optimistic update
        setNotes(prev => ({
          ...prev,
          [noteTransaction!.id]: {
            id: prev[noteTransaction!.id]?.id || 'new',
            note: noteText.trim() || null,
            tags: noteTags,
            updated_at: new Date().toISOString(),
          },
        }))
        setNoteTransaction(null)
      } catch (e) {
        setNoteError(e instanceof Error ? e.message : 'Failed to save note')
      }
    })
  }

  function handleDeleteNote() {
    setNoteError('')
    startNoteTransition(async () => {
      try {
        await deleteTransactionNote(noteTransaction!.id)
        setNotes(prev => {
          const next = { ...prev }
          delete next[noteTransaction!.id]
          return next
        })
        setNoteTransaction(null)
      } catch (e) {
        setNoteError(e instanceof Error ? e.message : 'Failed to delete note')
      }
    })
  }

  function handleCategorySelect(newCategory: string) {
    setCategoryError('')
    startCategoryTransition(async () => {
      try {
        await updateTransactionCategory(categoryEditTx!.id, newCategory)
        // Optimistic update
        setTransactions(prev => prev.map(tx =>
          tx.id === categoryEditTx!.id
            ? { ...tx, category: newCategory, original_category: tx.original_category || tx.category, category_edited_at: new Date().toISOString() }
            : tx
        ))
        setCategoryEditTx(null)
      } catch (e) {
        setCategoryError(e instanceof Error ? e.message : 'Failed to update category')
      }
    })
  }

  function handleCategoryReset() {
    setCategoryError('')
    startCategoryTransition(async () => {
      try {
        await resetTransactionCategory(categoryEditTx!.id)
        setTransactions(prev => prev.map(tx =>
          tx.id === categoryEditTx!.id
            ? { ...tx, category: tx.original_category || tx.category, original_category: null, category_edited_at: null }
            : tx
        ))
        setCategoryEditTx(null)
      } catch (e) {
        setCategoryError(e instanceof Error ? e.message : 'Failed to reset category')
      }
    })
  }

  function handleExport() {
    const params = new URLSearchParams()
    if (accountFilter) params.set('accountId', accountFilter)
    if (categoryFilter) params.set('category', categoryFilter)
    if (typeFilter) params.set('type', typeFilter)

    const url = `/api/transactions/export${params.toString() ? `?${params.toString()}` : ''}`
    window.location.href = url
  }

  return (
    <>
      {/* Filters */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                className="pl-9 rounded-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {accounts.length > 1 && (
              <Select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} className="md:w-44 rounded-full">
                <option value="">All accounts</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.nickname || acc.account_name}</option>
                ))}
              </Select>
            )}
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="md:w-40 rounded-full">
              <option value="">All categories</option>
              {Object.entries(transactionCategories).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </Select>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="md:w-32 rounded-full">
              <option value="">All types</option>
              <option value="credit">Money in</option>
              <option value="debit">Money out</option>
            </Select>
            {availableTags.length > 0 && (
              <Select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="md:w-40 rounded-full">
                <option value="">All tags</option>
                {availableTags.map((tag) => (
                  <option key={tag} value={tag}>{getTagLabel(tag)}</option>
                ))}
              </Select>
            )}
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dispute Dialog */}
      <Dialog
        open={!!disputeTransaction}
        onClose={() => setDisputeTransaction(null)}
        title="Dispute Transaction"
      >
        {disputeSuccess ? (
          <div className="text-center py-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 mb-3">
              <ShieldAlert className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-sm font-medium">Dispute Filed Successfully</p>
            <p className="text-xs text-muted-foreground mt-1">You can track your dispute from the Disputes page.</p>
          </div>
        ) : disputeTransaction ? (
          <div className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <p className="font-medium">{disputeTransaction.description}</p>
              <p className="text-muted-foreground">
                {disputeTransaction.counterparty_name} &middot; {formatGBP(disputeTransaction.amount)}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Reason</label>
              <Select value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} className="mt-1">
                <option value="">Select a reason...</option>
                <option value="unauthorized">Unauthorised Transaction</option>
                <option value="duplicate">Duplicate Charge</option>
                <option value="wrong_amount">Wrong Amount</option>
                <option value="not_received">Goods/Services Not Received</option>
                <option value="defective">Defective/Not as Described</option>
                <option value="cancelled">Cancelled Order</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Description (optional)</label>
              <Input
                placeholder="Describe the issue..."
                value={disputeDescription}
                onChange={(e) => setDisputeDescription(e.target.value)}
                className="mt-1"
              />
            </div>
            {disputeError && <p className="text-sm text-destructive">{disputeError}</p>}
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setDisputeTransaction(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={handleDisputeSubmit} disabled={isDisputing}>
                {isDisputing ? 'Filing...' : 'File Dispute'}
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>

      {/* Note Dialog */}
      <Dialog
        open={!!noteTransaction}
        onClose={() => setNoteTransaction(null)}
        title="Transaction Note"
      >
        {noteTransaction && (
          <div className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <p className="font-medium">{noteTransaction.description}</p>
              <p className="text-muted-foreground">
                {noteTransaction.counterparty_name} &middot; {formatGBP(noteTransaction.amount)} &middot; {formatTransactionDate(noteTransaction.transaction_date)}
              </p>
            </div>

            {/* Note text */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Note</label>
              <textarea
                className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                placeholder="Add a personal note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">{noteText.length}/500 characters</p>
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tags</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {presetTags.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => toggleTag(preset.id)}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      noteTags.includes(preset.id)
                        ? `${preset.bg} ${preset.color} ring-1 ring-current`
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    <Tag className="h-3 w-3" />
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Selected custom tags */}
              {noteTags.filter(t => !presetTags.find(p => p.id === t)).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {noteTags.filter(t => !presetTags.find(p => p.id === t)).map(tag => (
                    <Badge key={tag} variant="default" className="gap-1">
                      {getTagLabel(tag)}
                      <button type="button" onClick={() => toggleTag(tag)} className="ml-0.5 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Custom tag input */}
              <div className="mt-2 flex gap-2">
                <Input
                  placeholder="Custom tag..."
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                  maxLength={30}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={addCustomTag} disabled={!customTag.trim()}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{noteTags.length}/10 tags</p>
            </div>

            {noteError && <p className="text-sm text-destructive">{noteError}</p>}

            <div className="flex gap-2 pt-1">
              {notes[noteTransaction.id] && (
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleDeleteNote} disabled={isSavingNote}>
                  Delete
                </Button>
              )}
              <div className="flex-1" />
              <Button variant="ghost" onClick={() => setNoteTransaction(null)}>Cancel</Button>
              <Button onClick={handleSaveNote} disabled={isSavingNote}>
                {isSavingNote ? 'Saving...' : 'Save Note'}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Category Edit Dialog */}
      <Dialog
        open={!!categoryEditTx}
        onClose={() => setCategoryEditTx(null)}
        title="Change Category"
      >
        {categoryEditTx && (
          <div className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <p className="font-medium">{categoryEditTx.description}</p>
              <p className="text-muted-foreground">
                Current: {transactionCategories[categoryEditTx.category as TransactionCategory]?.label || categoryEditTx.category}
                {categoryEditTx.original_category && (
                  <span> (originally {transactionCategories[categoryEditTx.original_category as TransactionCategory]?.label || categoryEditTx.original_category})</span>
                )}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {Object.entries(transactionCategories).map(([key, val]) => {
                const CatIcon = val.icon
                const isSelected = categoryEditTx.category === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleCategorySelect(key)}
                    disabled={isSavingCategory || isSelected}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                    } disabled:opacity-50`}
                  >
                    <div className={`rounded-full p-2 ${val.bg}`}>
                      <CatIcon className={`h-4 w-4 ${val.color}`} />
                    </div>
                    <span className="text-xs font-medium">{val.label}</span>
                  </button>
                )
              })}
            </div>

            {categoryEditTx.original_category && (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={handleCategoryReset}
                disabled={isSavingCategory}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset to Original ({transactionCategories[categoryEditTx.original_category as TransactionCategory]?.label || categoryEditTx.original_category})
              </Button>
            )}

            {categoryError && <p className="text-sm text-destructive">{categoryError}</p>}
            {isSavingCategory && <p className="text-sm text-muted-foreground text-center">Updating...</p>}
          </div>
        )}
      </Dialog>

      {/* Results */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No transactions found matching your filters.
              </div>
            ) : (
              filtered.map((tx) => {
                const cat = transactionCategories[tx.category as TransactionCategory]
                const Icon = cat?.icon
                const txNote = notes[tx.id]
                return (
                  <div key={tx.id} className="group flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => { setCategoryEditTx(tx); setCategoryError('') }}
                        className={`relative rounded-full p-2.5 shrink-0 ${cat?.bg} hover:ring-2 hover:ring-primary/30 transition-all`}
                        title="Change category"
                      >
                        {Icon && <Icon className={`h-4 w-4 ${cat?.color}`} />}
                        <Pencil className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity bg-background rounded-full p-0.5" />
                        {tx.original_category && (
                          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 border-2 border-background" title="Category edited" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{tx.description}</p>
                          {txNote && (txNote.note || txNote.tags.length > 0) && (
                            <StickyNote className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {tx.counterparty_name} &middot; {formatTransactionDate(tx.transaction_date)}
                        </p>
                        {/* Inline tag pills */}
                        {txNote && txNote.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {txNote.tags.map(tag => (
                              <span key={tag} className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getTagColor(tag)}`}>
                                {getTagLabel(tag)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2 shrink-0">
                      {/* Note button */}
                      <button
                        onClick={() => openNoteDialog(tx)}
                        className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 hover:bg-muted transition-all"
                        title="Add note"
                      >
                        <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      {/* Dispute button */}
                      {tx.type === 'debit' && (
                        <button
                          onClick={() => { setDisputeTransaction(tx); setDisputeError(''); setDisputeSuccess(false); setDisputeReason(''); setDisputeDescription('') }}
                          className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 hover:bg-muted transition-all"
                          title="Dispute this transaction"
                        >
                          <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      )}
                      <div>
                        <p className={`text-sm font-semibold tabular-nums ${tx.type === 'credit' ? 'text-success' : ''}`}>
                          {tx.type === 'credit' ? '+' : '-'}{formatGBP(tx.amount)}
                        </p>
                        {tx.balance_after !== null && (
                          <p className="text-xs text-muted-foreground tabular-nums">Bal: {formatGBP(tx.balance_after)}</p>
                        )}
                      </div>
                      {tx.type === 'credit' ? (
                        <ArrowDownLeft className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
