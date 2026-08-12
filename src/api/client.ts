import type {
  ApiErrorResponse,
  ApiFailure,
  EventResponse,
  SettingsResponse,
  SettingsUpdate,
} from '../types/api'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export class ApiError extends Error {
  status: number | null
  code: string
  details?: ApiFailure['details']

  constructor(failure: ApiFailure) {
    super(failure.message)
    this.name = 'ApiError'
    this.status = failure.status
    this.code = failure.code
    this.details = failure.details
  }
}

const isApiErrorResponse = (value: unknown): value is ApiErrorResponse => {
  if (!value || typeof value !== 'object' || !('error' in value)) return false
  const error = (value as { error?: unknown }).error
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      typeof error.code === 'string' &&
      'message' in error &&
      typeof error.message === 'string',
  )
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${apiBaseUrl}${path}`, init)
  } catch {
    throw new ApiError({
      status: null,
      code: 'NETWORK_ERROR',
      message: 'Unable to reach the API. Check that the backend is running.',
    })
  }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    if (response.ok) {
      throw new ApiError({
        status: response.status,
        code: 'INVALID_RESPONSE',
        message: 'The API returned an invalid JSON response.',
      })
    }
  }

  if (!response.ok) {
    if (isApiErrorResponse(data)) {
      throw new ApiError({
        status: response.status,
        code: data.error.code,
        message: data.error.message,
        details: data.error.details,
      })
    }

    throw new ApiError({
      status: response.status,
      code: 'HTTP_ERROR',
      message: `The API request failed with status ${response.status}.`,
    })
  }

  return data as T
}

const isEvent = (value: unknown): value is EventResponse => {
  if (!value || typeof value !== 'object') return false
  const event = value as Partial<EventResponse>
  return (
    typeof event.id === 'number' &&
    typeof event.name === 'string' &&
    typeof event.description === 'string' &&
    (event.location === null || typeof event.location === 'string') &&
    typeof event.date === 'string' &&
    Array.isArray(event.availableTickets)
  )
}

export async function getEvents(): Promise<EventResponse[]> {
  const data = await request<unknown>('/events')
  if (!Array.isArray(data) || !data.every(isEvent)) {
    throw new ApiError({
      status: 200,
      code: 'INVALID_RESPONSE',
      message: 'The API returned an unexpected events response.',
    })
  }
  return data
}

const isSettingsResponse = (value: unknown): value is SettingsResponse => {
  if (!value || typeof value !== 'object') return false
  const response = value as Partial<SettingsResponse>
  const settings = response.settings
  return Boolean(
    settings &&
      typeof settings === 'object' &&
      (settings.theme === 'light' || settings.theme === 'dark') &&
      typeof settings.maintenanceMode === 'boolean' &&
      typeof settings.maxTicketsPerOrder === 'number' &&
      settings.checkout &&
      typeof settings.checkout === 'object' &&
      typeof settings.checkout.enabled === 'boolean' &&
      typeof settings.checkout.timeoutMinutes === 'number' &&
      Array.isArray(settings.supportedCurrencies),
  )
}

const assertSettingsResponse = (data: unknown): SettingsResponse => {
  if (!isSettingsResponse(data)) {
    throw new ApiError({
      status: 200,
      code: 'INVALID_RESPONSE',
      message: 'The API returned an unexpected settings response.',
    })
  }
  return data
}

export async function getSettings(): Promise<SettingsResponse> {
  return assertSettingsResponse(await request<unknown>('/settings'))
}

export async function postSettings(update: SettingsUpdate): Promise<SettingsResponse> {
  return assertSettingsResponse(
    await request<unknown>('/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    }),
  )
}

export function toApiFailure(error: unknown): ApiFailure {
  if (error instanceof ApiError) {
    return {
      status: error.status,
      code: error.code,
      message: error.message,
      details: error.details,
    }
  }
  return {
    status: null,
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred.',
  }
}
