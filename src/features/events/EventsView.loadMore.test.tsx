import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { EventResponse } from '../../types/api'
import EventsView from './EventsView'
import eventsReducer from './eventsSlice'

const createEvents = (count: number): EventResponse[] =>
  Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `Event ${index + 1}`,
    description: `Description ${index + 1}`,
    location: null,
    date: new Date(Date.UTC(2026, 8, index + 1)).toISOString(),
    created_at: '2026-08-11T20:00:00.000Z',
    updated_at: '2026-08-11T20:00:00.000Z',
    availableTickets: [],
  }))

const createStore = (events: EventResponse[]) =>
  configureStore({
    reducer: { events: eventsReducer },
    preloadedState: {
      events: { items: events, status: 'succeeded' as const, error: null },
    },
  })

const renderView = (count: number) =>
  render(
    <Provider store={createStore(createEvents(count))}>
      <EventsView />
    </Provider>,
  )

const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('EventsView load more', () => {
  it('reveals events six at a time and removes the control at the end', async () => {
    const user = userEvent.setup()
    renderView(14)

    expect(screen.getByText('Showing 6 of 14 events')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Event 7' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Load more events' }))
    expect(screen.getByText('Showing 12 of 14 events')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Event 12' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Load more events' }))
    expect(screen.getByText('Showing 14 of 14 events')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Event 14' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Load more events' })).not.toBeInTheDocument()
  })

  it('does not show load more when every event is already visible', () => {
    renderView(6)

    expect(screen.getByText('Showing 6 of 6 events')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Load more events' })).not.toBeInTheDocument()
  })

  it('resets to the first batch after a successful refresh', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(createEvents(13))))
    const user = userEvent.setup()
    renderView(13)

    await user.click(screen.getByRole('button', { name: 'Load more events' }))
    expect(screen.getByText('Showing 12 of 13 events')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Refresh' }))
    await waitFor(() => expect(screen.getByText('Showing 6 of 13 events')).toBeInTheDocument())
  })

  it('preserves revealed events after a failed refresh', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ message: 'Down' }, 503)))
    const user = userEvent.setup()
    renderView(13)

    await user.click(screen.getByRole('button', { name: 'Load more events' }))
    await user.click(screen.getByRole('button', { name: 'Refresh' }))

    expect(await screen.findByText('The API request failed with status 503.')).toBeInTheDocument()
    expect(screen.getByText('Showing 12 of 13 events')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Event 12' })).toBeInTheDocument()
  })
})
