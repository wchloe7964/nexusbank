export type TokenType = 'payment' | 'display' | 'recurring'
export type PciAccessType = 'card_view' | 'card_create' | 'card_update' | 'card_freeze' | 'card_cancel' | 'token_create' | 'token_revoke' | 'pan_access'

export interface CardToken {
  id: string
  user_id: string
  token: string
  card_id: string | null
  token_type: TokenType
  last_four: string
  expiry_month: number | null
  expiry_year: number | null
  is_active: boolean
  created_at: string
  expires_at: string | null
}

export interface PciAccessLog {
  id: number
  actor_id: string | null
  actor_role: string | null
  access_type: PciAccessType
  card_id: string | null
  token_id: string | null
  reason: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}
