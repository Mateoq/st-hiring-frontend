import type { TicketResponse } from '../../types/api'

export interface TicketGroup {
  type: string
  price: number
  quantity: number
}

export function groupTickets(tickets: TicketResponse[]): TicketGroup[] {
  const groups = new Map<string, TicketGroup>()

  tickets.forEach((ticket) => {
    const key = JSON.stringify([ticket.type, ticket.price])
    const existingGroup = groups.get(key)

    if (existingGroup) {
      existingGroup.quantity += 1
    } else {
      groups.set(key, {
        type: ticket.type,
        price: ticket.price,
        quantity: 1,
      })
    }
  })

  return [...groups.values()]
}
