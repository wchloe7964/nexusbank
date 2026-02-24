'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function AddPayeeButton() {
  return (
    <Button size="sm" onClick={() => document.getElementById('add-payee-trigger')?.click()}>
      <Plus className="mr-2 h-4 w-4" />
      Add Payee
    </Button>
  )
}
