import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { CircleDollarSign } from 'lucide-react'
import Link from 'next/link'
import { getCreditCardById } from '@/lib/queries/credit-cards'
import { getAccounts } from '@/lib/queries/accounts'
import { CreditCardDetailClient } from './credit-card-detail-client'

export default async function CreditCardDetailPage({ params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params
  const [card, accounts] = await Promise.all([
    getCreditCardById(cardId),
    getAccounts(),
  ])

  if (!card) {
    return (
      <div className="space-y-8">
        <PageHeader title="Credit Card" description="Not found" />
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <CircleDollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Credit card not found</p>
            <p className="mt-1 text-xs text-muted-foreground">This card may have been closed.</p>
            <Link href="/my-credit-cards" className="text-sm text-primary hover:underline mt-2 inline-block">
              Back to Credit Cards
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader title={card.card_name} description="Credit card details" />
      <CreditCardDetailClient card={card} accounts={accounts} />
    </div>
  )
}
