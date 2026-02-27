import { getConsents } from '@/lib/queries/open-banking'
import { OpenBankingClient } from './open-banking-client'

export default async function OpenBankingPage() {
  const consents = await getConsents()
  return <OpenBankingClient consents={consents} />
}
