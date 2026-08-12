import { afterEach, describe, expect, it, vi } from 'vitest'
import { getEvents, postSettings } from './client'

const event = {
  id: 1,
  name: 'Summer Festival',
  description: 'An outdoor music festival',
  location: 'Bogota',
  date: '2026-09-15T19:00:00.000Z',
  created_at: '2026-08-11T20:00:00.000Z',
  updated_at: '2026-08-11T20:00:00.000Z',
  availableTickets: [],
}

const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('API client', () => {
  it('loads an events array', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response([event])))
    await expect(getEvents()).resolves.toEqual([event])
  })

  it('rejects a malformed successful events response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ events: [] })))
    await expect(getEvents()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })

  it('preserves structured validation errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        response(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Request validation failed',
              details: [{ path: 'body.maxTicketsPerOrder', message: 'Must be positive' }],
            },
          },
          400,
        ),
      ),
    )

    await expect(postSettings({ maxTicketsPerOrder: 0 })).rejects.toEqual(
      expect.objectContaining({
        status: 400,
        code: 'VALIDATION_ERROR',
        details: [{ path: 'body.maxTicketsPerOrder', message: 'Must be positive' }],
      }),
    )
  })

  it('uses JSON for settings updates', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      response({
        settings: {
          theme: 'dark',
          maintenanceMode: false,
          maxTicketsPerOrder: 4,
          checkout: { enabled: true, timeoutMinutes: 15 },
          supportedCurrencies: ['USD'],
        },
        createdAt: null,
        updatedAt: null,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await postSettings({ maxTicketsPerOrder: 4 })
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/settings$/),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxTicketsPerOrder: 4 }),
      }),
    )
  })
})
