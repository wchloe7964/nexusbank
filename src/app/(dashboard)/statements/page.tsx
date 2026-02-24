import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { FileDown } from 'lucide-react'
import { getAccounts } from '@/lib/queries/accounts'
import { StatementsClient } from './statements-client'

export default async function StatementsPage() {
  const accounts = await getAccounts()

  return (
    <div className="space-y-8">
      <PageHeader
        title="Statements"
        description="View and download your monthly statements"
      />

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <FileDown className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No accounts found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Statements will appear here once you have an account.
            </p>
          </CardContent>
        </Card>
      ) : (
        <StatementsClient accounts={accounts} />
      )}
    </div>
  )
}
