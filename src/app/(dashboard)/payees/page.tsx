import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { User } from 'lucide-react'
import { getPayees } from '@/lib/queries/payees'
import { PayeesClient } from './payees-client'
import { AddPayeeButton } from './add-payee-button'

export default async function PayeesPage() {
  const payees = await getPayees()

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Payees"
        description="Manage your saved recipients"
        action={<AddPayeeButton />}
      />

      {payees.length === 0 ? (
        <Card>
          <CardContent className="p-5 lg:p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No payees yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add a payee to get started with payments.
            </p>
          </CardContent>
        </Card>
      ) : (
        <PayeesClient initialPayees={payees} />
      )}
    </div>
  )
}
