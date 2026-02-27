import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { CreditCard } from 'lucide-react'
import { getCards } from '@/lib/queries/cards'
import { CardsClient } from './cards-client'

export default async function CardsPage() {
  const cards = await getCards()

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader title="Cards" description="Manage your debit and credit cards" />

      {cards.length === 0 ? (
        <Card>
          <CardContent className="p-5 lg:p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No cards yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Your cards will appear here once they&apos;re set up.
            </p>
          </CardContent>
        </Card>
      ) : (
        <CardsClient initialCards={cards} />
      )}
    </div>
  )
}
