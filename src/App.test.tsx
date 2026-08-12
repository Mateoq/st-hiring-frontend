import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import eventsReducer from './features/events/eventsSlice'
import settingsReducer from './features/settings/settingsSlice'

const settings = {
  theme: 'dark',
  maintenanceMode: false,
  maxTicketsPerOrder: 8,
  checkout: { enabled: true, timeoutMinutes: 15 },
  supportedCurrencies: ['USD', 'EUR', 'COP'],
}

const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const createStore = () =>
  configureStore({
    reducer: { events: eventsReducer, settings: settingsReducer },
  })

const renderApp = (fetchMock: ReturnType<typeof vi.fn>) => {
  vi.stubGlobal('fetch', fetchMock)
  render(
    <Provider store={createStore()}>
      <App />
    </Provider>,
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('App workflows', () => {
  it('warns before leaving dirty settings and saves a partial update', async () => {
    const fetchMock = vi.fn().mockImplementation((path: string, init?: RequestInit) => {
      if (path.endsWith('/events')) return Promise.resolve(response([]))
      if (path.endsWith('/settings') && init?.method === 'POST') {
        return Promise.resolve(
          response({
            settings: { ...settings, maxTicketsPerOrder: 4 },
            createdAt: '2026-08-11T20:00:00.000Z',
            updatedAt: '2026-08-11T20:30:00.000Z',
          }),
        )
      }
      return Promise.resolve(response({ settings, createdAt: null, updatedAt: null }))
    })
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    renderApp(fetchMock)

    await user.click(screen.getByRole('tab', { name: 'Settings' }))
    const maximumTickets = await screen.findByLabelText('Maximum tickets per order')
    await user.clear(maximumTickets)
    await user.type(maximumTickets, '4')

    await user.click(screen.getByRole('tab', { name: 'Events' }))
    expect(confirm).toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Save settings' }))
    expect(await screen.findByText('Settings saved')).toBeInTheDocument()

    const postCall = fetchMock.mock.calls.find(
      ([path, init]) =>
        (path as string).endsWith('/settings') &&
        (init as RequestInit | undefined)?.method === 'POST',
    )
    expect(postCall).toBeDefined()
    expect(JSON.parse((postCall?.[1] as RequestInit).body as string)).toEqual({
      maxTicketsPerOrder: 4,
    })
    expect(screen.getByRole('button', { name: 'Save settings' })).toBeDisabled()
  })

  it('maps backend validation details onto form fields', async () => {
    const fetchMock = vi.fn().mockImplementation((path: string, init?: RequestInit) => {
      if (path.endsWith('/events')) return Promise.resolve(response([]))
      if (path.endsWith('/settings') && init?.method === 'POST') {
        return Promise.resolve(
          response(
            {
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Request validation failed',
                details: [
                  {
                    path: 'body.maxTicketsPerOrder',
                    message: 'The backend rejected this value',
                  },
                ],
              },
            },
            400,
          ),
        )
      }
      return Promise.resolve(response({ settings, createdAt: null, updatedAt: null }))
    })
    const user = userEvent.setup()
    renderApp(fetchMock)

    await user.click(screen.getByRole('tab', { name: 'Settings' }))
    const maximumTickets = await screen.findByLabelText('Maximum tickets per order')
    await user.clear(maximumTickets)
    await user.type(maximumTickets, '4')
    await user.click(screen.getByRole('button', { name: 'Save settings' }))

    expect(await screen.findByText('The backend rejected this value')).toBeInTheDocument()
    await waitFor(() => expect(maximumTickets).toHaveAttribute('aria-invalid', 'true'))
  })
})
