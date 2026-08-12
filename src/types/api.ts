export interface TicketResponse {
  id: number
  event_id: number
  type: string
  status: 'available'
  price: number
  created_at: string
  updated_at: string
}

export interface EventResponse {
  id: number
  name: string
  description: string
  location: string | null
  date: string
  created_at: string
  updated_at: string
  availableTickets: TicketResponse[]
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

export type Theme = 'light' | 'dark'

export interface CheckoutSettings {
  enabled: boolean
  timeoutMinutes: number
}

export interface CoreSettings {
  theme: Theme
  maintenanceMode: boolean
  maxTicketsPerOrder: number
  checkout: CheckoutSettings
  supportedCurrencies: string[]
}

export type Settings = CoreSettings & Record<string, JsonValue>

export type SettingsUpdate = {
  theme?: Theme
  maintenanceMode?: boolean
  maxTicketsPerOrder?: number
  checkout?: Partial<CheckoutSettings>
  supportedCurrencies?: string[]
  [key: string]: JsonValue | Partial<CheckoutSettings> | undefined
}

export interface SettingsResponse {
  settings: Settings
  createdAt: string | null
  updatedAt: string | null
}

export interface ApiErrorDetail {
  path: string
  message: string
}

export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    details?: ApiErrorDetail[]
  }
}

export interface ApiFailure {
  status: number | null
  code: string
  message: string
  details?: ApiErrorDetail[]
}

export type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed'
