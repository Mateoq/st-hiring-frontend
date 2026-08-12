import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import type { EventResponse } from '../../types/api'
import { groupTickets } from './eventPresentation'
import { fetchEvents } from './eventsSlice'

const EVENT_BATCH_SIZE = 6

const formatEventDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date TBA'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date)
}

export function EventCard({ event }: { event: EventResponse }) {
  const ticketGroups = groupTickets(event.availableTickets)

  return (
    <Card component="article" variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              {event.name}
            </Typography>
            <Typography color="text.secondary">{event.description}</Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Chip label={formatEventDate(event.date)} size="small" />
            <Chip label={event.location?.trim() || 'Online/TBA'} size="small" />
            <Chip
              color={event.availableTickets.length > 0 ? 'success' : 'default'}
              label={`${event.availableTickets.length} available ticket${
                event.availableTickets.length === 1 ? '' : 's'
              }`}
              size="small"
            />
          </Stack>

          {event.availableTickets.length > 0 ? (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Tickets
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {ticketGroups.map((group) => (
                  <Chip
                    key={`${group.type}-${group.price}`}
                    label={`${group.type}: ${group.price.toLocaleString()} × ${group.quantity}`}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Stack>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No tickets are currently available.
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

const EventSkeletons = () => (
  <Box
    aria-label="Loading events"
    sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}
  >
    {[0, 1, 2, 3].map((item) => (
      <Card key={item} variant="outlined">
        <CardContent>
          <Skeleton variant="text" width="55%" height={40} />
          <Skeleton variant="text" />
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="rounded" height={32} sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    ))}
  </Box>
)

export default function EventsView() {
  const dispatch = useAppDispatch()
  const { items, status, error } = useAppSelector((state) => state.events)
  const [visibleCount, setVisibleCount] = useState(EVENT_BATCH_SIZE)

  useEffect(() => {
    if (status === 'idle') void dispatch(fetchEvents())
  }, [dispatch, status])

  useEffect(() => {
    setVisibleCount(EVENT_BATCH_SIZE)
  }, [items])

  const visibleItems = items.slice(0, visibleCount)
  const hasMoreEvents = visibleItems.length < items.length

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="h4" component="h1">
            Events
          </Typography>
          <Typography color="text.secondary">Browse events with tickets available now.</Typography>
        </Box>
        <Button
          variant="outlined"
          disabled={status === 'loading'}
          onClick={() => void dispatch(fetchEvents())}
        >
          Refresh
        </Button>
      </Stack>

      {status === 'loading' && items.length === 0 && <EventSkeletons />}

      {status === 'failed' && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void dispatch(fetchEvents())}>
              Retry
            </Button>
          }
        >
          {error?.message ?? 'Unable to load events.'}
        </Alert>
      )}

      {status === 'succeeded' && items.length === 0 && (
        <Card variant="outlined">
          <CardContent sx={{ textAlign: 'center', py: 7 }}>
            <Typography variant="h6">No events found</Typography>
            <Typography color="text.secondary">Check again later for newly available events.</Typography>
          </CardContent>
        </Card>
      )}

      {items.length > 0 && (
        <Stack spacing={3}>
          <Typography color="text.secondary" aria-live="polite">
            Showing {visibleItems.length} of {items.length} events
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
              gap: 3,
            }}
          >
            {visibleItems.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </Box>
          {hasMoreEvents && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                disabled={status === 'loading'}
                onClick={() =>
                  setVisibleCount((count) => Math.min(count + EVENT_BATCH_SIZE, items.length))
                }
              >
                Load more events
              </Button>
            </Box>
          )}
        </Stack>
      )}
    </Stack>
  )
}
