import { OpenAccountClient } from './open-account-client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function OpenAccountPage() {
  return (
    <div className="space-y-8">
      <Link
        href="/accounts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Accounts
      </Link>

      <OpenAccountClient />
    </div>
  )
}
