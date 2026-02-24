'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import { formatSortCode } from '@/lib/utils/sort-code'
import { maskAccountNumber } from '@/lib/utils/account-number'
import { Search, Plus, Star, Trash2, User, Send } from 'lucide-react'
import Link from 'next/link'
import type { Payee } from '@/lib/types'
import { addPayee, togglePayeeFavourite, deletePayee as deletePayeeAction } from './actions'

interface PayeesClientProps {
  initialPayees: Payee[]
}

export function PayeesClient({ initialPayees }: PayeesClientProps) {
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newPayee, setNewPayee] = useState({ name: '', sortCode: '', accountNumber: '', reference: '' })
  const [payees, setPayees] = useState(initialPayees)
  const [isPending, startTransition] = useTransition()

  const filtered = payees.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.reference?.toLowerCase().includes(search.toLowerCase())
  )

  const favourites = filtered.filter((p) => p.is_favourite)
  const others = filtered.filter((p) => !p.is_favourite)

  function handleToggleFavourite(id: string) {
    const payee = payees.find((p) => p.id === id)
    if (!payee) return
    const newFav = !payee.is_favourite
    setPayees((prev) => prev.map((p) => p.id === id ? { ...p, is_favourite: newFav } : p))
    startTransition(async () => {
      try {
        await togglePayeeFavourite(id, newFav)
      } catch {
        setPayees((prev) => prev.map((p) => p.id === id ? { ...p, is_favourite: !newFav } : p))
      }
    })
  }

  function handleDeletePayee(id: string) {
    const removed = payees.find((p) => p.id === id)
    setPayees((prev) => prev.filter((p) => p.id !== id))
    startTransition(async () => {
      try {
        await deletePayeeAction(id)
      } catch {
        if (removed) setPayees((prev) => [...prev, removed])
      }
    })
  }

  function handleAddPayee() {
    if (!newPayee.name || !newPayee.sortCode || !newPayee.accountNumber) return
    startTransition(async () => {
      try {
        await addPayee({
          name: newPayee.name,
          sortCode: newPayee.sortCode,
          accountNumber: newPayee.accountNumber,
          reference: newPayee.reference || undefined,
        })
        setNewPayee({ name: '', sortCode: '', accountNumber: '', reference: '' })
        setShowAdd(false)
        // Refresh will happen via revalidatePath; for now add optimistically
        window.location.reload()
      } catch {
        // Handle error silently
      }
    })
  }

  function PayeeRow({ payee }: { payee: Payee }) {
    return (
      <div className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/[0.08] p-2.5">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{payee.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatSortCode(payee.sort_code)} &middot; {maskAccountNumber(payee.account_number)}
            </p>
            {payee.reference && (
              <p className="text-xs text-muted-foreground">Ref: {payee.reference}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Link href={`/payees/pay?id=${payee.id}`}>
            <Button variant="ghost" size="sm" title="Pay this payee">
              <Send className="h-4 w-4 text-primary" />
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => handleToggleFavourite(payee.id)} disabled={isPending}>
            <Star className={`h-4 w-4 ${payee.is_favourite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDeletePayee(payee.id)} disabled={isPending}>
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardContent className="p-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search payees..."
              className="pl-9 rounded-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {favourites.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            Favourites
          </h3>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {favourites.map((p) => <PayeeRow key={p.id} payee={p} />)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {others.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">All Payees</h3>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {others.map((p) => <PayeeRow key={p.id} payee={p} />)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {filtered.length === 0 && payees.length > 0 && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No payees match your search.
          </CardContent>
        </Card>
      )}

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title="Add New Payee">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input placeholder="Payee name" className="rounded-full" value={newPayee.name} onChange={(e) => setNewPayee({ ...newPayee, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Sort Code</label>
            <Input placeholder="00-00-00" className="rounded-full" value={newPayee.sortCode} onChange={(e) => setNewPayee({ ...newPayee, sortCode: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Account Number</label>
            <Input placeholder="12345678" className="rounded-full" value={newPayee.accountNumber} onChange={(e) => setNewPayee({ ...newPayee, accountNumber: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reference (optional)</label>
            <Input placeholder="Payment reference" className="rounded-full" value={newPayee.reference} onChange={(e) => setNewPayee({ ...newPayee, reference: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleAddPayee} disabled={!newPayee.name || !newPayee.sortCode || !newPayee.accountNumber || isPending}>
              Add Payee
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Hidden trigger for add dialog */}
      <button id="add-payee-trigger" className="hidden" onClick={() => setShowAdd(true)} />
    </>
  )
}
