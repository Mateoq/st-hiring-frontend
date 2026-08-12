import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { EventResponse } from '../../types/api'
import { EventCard } from './EventsView'

const event: EventResponse = {
  id: 1,
  name: 'Summer Festival',
  description: 'An outdoor music festival',
  location: null,
  date: '2026-09-15T19:00:00.000Z',
  created_at: '2026-08-11T20:00:00.000Z',
  updated_at: '2026-08-11T20:00:00.000Z',
  availableTickets: [
    {
      id: 101,
      event_id: 1,
      type: 'general',
      status: 'available',
      price: 1000,
      created_at: '2026-08-11T20:00:00.000Z',
      updated_at: '2026-08-11T20:00:00.000Z',
    },
    {
      id: 102,
      event_id: 1,
      type: 'general',
      status: 'available',
      price: 1000,
      created_at: '2026-08-11T20:00:00.000Z',
      updated_at: '2026-08-11T20:00:00.000Z',
    },
    {
      id: 103,
      event_id: 1,
      type: 'general',
      status: 'available',
      price: 1000,
      created_at: '2026-08-11T20:00:00.000Z',
      updated_at: '2026-08-11T20:00:00.000Z',
    },
    {
      id: 104,
      event_id: 1,
      type: 'general',
      status: 'available',
      price: 1200,
      created_at: '2026-08-11T20:00:00.000Z',
      updated_at: '2026-08-11T20:00:00.000Z',
    },
  ],
}

describe('EventCard', () => {
  it('renders relevant event and ticket information with a location fallback', () => {
    render(<EventCard event={event} />)

    expect(screen.getByRole('heading', { name: 'Summer Festival' })).toBeInTheDocument()
    expect(screen.getByText('An outdoor music festival')).toBeInTheDocument()
    expect(screen.getByText('Online/TBA')).toBeInTheDocument()
    expect(screen.getByText('4 available tickets')).toBeInTheDocument()
    expect(screen.getByText(/general: 1[,.]000 × 3/)).toBeInTheDocument()
    expect(screen.getByText(/general: 1[,.]200 × 1/)).toBeInTheDocument()
    expect(screen.getAllByText(/general:/)).toHaveLength(2)
  })

  it('renders the no-ticket state', () => {
    render(<EventCard event={{ ...event, availableTickets: [] }} />)

    expect(screen.getByText('0 available tickets')).toBeInTheDocument()
    expect(screen.getByText('No tickets are currently available.')).toBeInTheDocument()
  })
})
