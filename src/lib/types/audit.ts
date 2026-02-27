export type AuditEventType =
  | 'data_access'
  | 'data_change'
  | 'admin_action'
  | 'auth_event'
  | 'payment_event'
  | 'compliance_event'
  | 'fraud_event'
  | 'sar_event'

export interface AuditEvent {
  id: number
  event_type: AuditEventType
  actor_id: string | null
  actor_role: string | null
  target_table: string | null
  target_id: string | null
  action: string
  details: Record<string, unknown>
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface AuditStats {
  total_events: number
  admin_actions: number
  data_access: number
  auth_events: number
  payment_events: number
  compliance_events: number
  fraud_events: number
  period_days: number
}

export type ComplianceReportType =
  | 'sar'
  | 'str'
  | 'ctr'
  | 'annual_aml'
  | 'quarterly_fca'
  | 'pci_dss_saq'
  | 'data_retention'
  | 'risk_assessment'
  | 'custom'

export type ComplianceReportStatus =
  | 'draft'
  | 'in_progress'
  | 'pending_review'
  | 'approved'
  | 'submitted'
  | 'rejected'

export interface ComplianceReport {
  id: string
  report_type: ComplianceReportType
  title: string
  description: string | null
  status: ComplianceReportStatus
  generated_by: string | null
  reviewed_by: string | null
  submitted_at: string | null
  reporting_period_start: string | null
  reporting_period_end: string | null
  data: Record<string, unknown>
  notes: string | null
  created_at: string
  updated_at: string
}

export interface DataRetentionPolicy {
  id: string
  table_name: string
  retention_days: number
  description: string | null
  is_active: boolean
  last_cleanup_at: string | null
  created_at: string
  updated_at: string
}
