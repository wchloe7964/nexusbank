'use client'

import { Button } from '@/components/ui/button'
import { CheckCheck } from 'lucide-react'

export function MarkAllReadButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => document.getElementById('mark-all-read-trigger')?.click()}
    >
      <CheckCheck className="mr-2 h-4 w-4" />
      Mark All Read
    </Button>
  )
}
