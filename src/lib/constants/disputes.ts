import { ShieldAlert, Copy, DollarSign, PackageX, CircleSlash, XCircle, HelpCircle } from 'lucide-react'

export const disputeReasons = {
  unauthorized: { label: 'Unauthorised Transaction', icon: ShieldAlert, description: 'I did not make or authorise this transaction' },
  duplicate: { label: 'Duplicate Charge', icon: Copy, description: 'I was charged more than once for the same purchase' },
  wrong_amount: { label: 'Wrong Amount', icon: DollarSign, description: 'The amount charged is different from what I agreed' },
  not_received: { label: 'Goods/Services Not Received', icon: PackageX, description: 'I paid but never received the item or service' },
  defective: { label: 'Defective/Not as Described', icon: CircleSlash, description: 'The item or service was faulty or not as advertised' },
  cancelled: { label: 'Cancelled Order', icon: XCircle, description: 'I cancelled but was still charged' },
  other: { label: 'Other', icon: HelpCircle, description: 'Another issue with this transaction' },
} as const

export type DisputeReasonKey = keyof typeof disputeReasons

export const disputeStatusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive'; color: string }> = {
  submitted: { label: 'Submitted', variant: 'default', color: 'text-blue-500' },
  under_review: { label: 'Under Review', variant: 'warning', color: 'text-amber-500' },
  information_requested: { label: 'Info Requested', variant: 'warning', color: 'text-orange-500' },
  resolved_refunded: { label: 'Refunded', variant: 'success', color: 'text-emerald-500' },
  resolved_denied: { label: 'Denied', variant: 'destructive', color: 'text-red-500' },
  closed: { label: 'Closed', variant: 'default', color: 'text-gray-500' },
}
