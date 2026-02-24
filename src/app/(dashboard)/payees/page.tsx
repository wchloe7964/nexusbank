'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import { formatSortCode } from '@/lib/utils/sort-code'
import { maskAccountNumber } from '@/lib/utils/account-number'
import { Search, Plus, Star, Trash2, Edit2, User } from 'lucide-react'
import type { Payee } from '@/lib/types'

const mockPayees: Payee[] = [
  { id: '1', user_id: '1', name: 'John Smith', sort_code: '20-00-00', account_number: '12345678', bank_name: 'NexusBank', reference: 'Rent', is_favourite: true, created_at: '', updated_at: '' },
  { id: '2', user_id: '1', name: 'British Gas', sort_code: '30-90-89', account_number: '87654321', bank_name: 'Lloyds', reference: 'Gas Bill', is_favourite: true, created_at: '', updated_at: '' },
  { id: '3', user_id: '1', name: 'Sky UK', sort_code: '60-00-01', account_number: '11223344', bank_name: 'NatWest', reference: 'TV Package', is_favourite: false, created_at: '', updated_at: '' },
  { id: '4', user_id: '1', name: 'HMRC', sort_code: '08-32-00', account_number: '99887766', bank_name: 'Bank of England', reference: 'Self Assessment', is_favourite: false, created_at: '', updated_at: '' },
  { id: '5', user_id: '1', name: 'Thames Water', sort_code: '20-18-15', account_number: '55667788', bank_name: 'HSBC', reference: 'Water Bill', is_favourite: true, created_at: '', updated_at: '' },
]

export default function PayeesPage() {
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newPayee, setNewPayee] = useState({ name: '', sortCode: '', accountNumber: '', bankName: '', reference: '' })
  const [payees, setPayees] = useState(mockPayees)

  const filtered = payees.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.reference?.toLowerCase().includes(search.toLowerCase())
  )

  const favourites = filtered.filter((p) => p.is_favourite)
  const others = filtered.filter((p) => !p.is_favourite)

  function toggleFavourite(id: string) {
    setPayees((prev) => prev.map((p) => p.id === id ? { ...p, is_favourite: !p.is_favourite } : p))
  }

  function deletePayee(id: string) {
    setPayees((prev) => prev.filter((p) => p.id !== id))
  }

  function handleAddPayee() {
    if (!newPayee.name || !newPayee.sortCode || !newPayee.accountNumber) return
    const payee: Payee = {
      id: String(Date.now()),
      user_id: '1',
      name: newPayee.name,
      sort_code: newPayee.sortCode,
      account_number: newPayee.accountNumber,
      bank_name: newPayee.bankName || null,
      reference: newPayee.reference || null,
      is_favourite: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setPayees((prev) => [...prev, payee])
    setNewPayee({ name: '', sortCode: '', accountNumber: '', bankName: '', reference: '' })
    setShowAdd(false)
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
              {payee.bank_name && ` · ${payee.bank_name}`}
            </p>
            {payee.reference && (
              <p className="text-xs text-muted-foreground">Ref: {payee.reference}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => toggleFavourite(payee.id)}>
            <Star className={`h-4 w-4 ${payee.is_favourite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => deletePayee(payee.id)}>
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Payees"
        description="Manage your saved recipients"
        action={
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Payee
          </Button>
        }
      />

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

      {filtered.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No payees found.
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
            <label className="text-sm font-medium">Bank Name (optional)</label>
            <Input placeholder="Bank name" className="rounded-full" value={newPayee.bankName} onChange={(e) => setNewPayee({ ...newPayee, bankName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reference (optional)</label>
            <Input placeholder="Payment reference" className="rounded-full" value={newPayee.reference} onChange={(e) => setNewPayee({ ...newPayee, reference: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleAddPayee} disabled={!newPayee.name || !newPayee.sortCode || !newPayee.accountNumber}>
              Add Payee
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
