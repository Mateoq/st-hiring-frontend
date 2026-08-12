import { describe, expect, it } from 'vitest'
import type { TicketResponse } from '../../types/api'
import { groupTickets } from './eventPresentation'

const ticket = (id: number, type: string, price: number): TicketResponse => ({
  id,
  event_id: 1,
  type,
  status: 'available',
  price,
  created_at: '2026-08-11T20:00:00.000Z',
  updated_at: '2026-08-11T20:00:00.000Z',
})

describe('groupTickets', () => {
  it('combines tickets with the same type and price', () => {
    expect(groupTickets([ticket(1, 'general', 1000), ticket(2, 'general', 1000)])).toEqual([
      { type: 'general', price: 1000, quantity: 2 },
    ])
  })

  it('keeps different prices separate and preserves first-seen order', () => {
    expect(
      groupTickets([
        ticket(1, 'vip', 2500),
        ticket(2, 'general', 1000),
        ticket(3, 'vip', 3000),
        ticket(4, 'vip', 2500),
      ]),
    ).toEqual([
      { type: 'vip', price: 2500, quantity: 2 },
      { type: 'general', price: 1000, quantity: 1 },
      { type: 'vip', price: 3000, quantity: 1 },
    ])
  })
})
