import { configureStore } from '@reduxjs/toolkit'
import { afterEach, describe, expect, it, vi } from 'vitest'
import eventsReducer, { fetchEvents } from './eventsSlice'

const createStore = () => configureStore({ reducer: { events: eventsReducer } })
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const event = (id: number, date: string) => ({
  id,
  name: `Event ${id}`,
  description: 'Description',
  location: null,
  date,
  created_at: date,
  updated_at: date,
  availableTickets: [],
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('events slice', () => {
  it('loads and sorts events by date', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        response([
          event(2, '2026-10-01T10:00:00.000Z'),
          event(1, '2026-09-01T10:00:00.000Z'),
        ]),
      ),
    )
    const store = createStore()

    await store.dispatch(fetchEvents())

    expect(store.getState().events.status).toBe('succeeded')
    expect(store.getState().events.items.map(({ id }) => id)).toEqual([1, 2])
  })

  it('accepts an empty response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response([])))
    const store = createStore()

    await store.dispatch(fetchEvents())

    expect(store.getState().events).toMatchObject({ status: 'succeeded', items: [] })
  })

  it('stores API failures for retry UI', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ message: 'Down' }, 503)))
    const store = createStore()

    await store.dispatch(fetchEvents())

    expect(store.getState().events.status).toBe('failed')
    expect(store.getState().events.error).toMatchObject({ status: 503, code: 'HTTP_ERROR' })
  })
})
