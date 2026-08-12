import { describe, expect, it } from 'vitest'
import type { CoreSettings } from '../../types/api'
import {
  buildSettingsUpdate,
  settingsValidationSchema,
  toFormValues,
  type SettingsFormValues,
} from './settingsForm'

const settings: CoreSettings = {
  theme: 'dark',
  maintenanceMode: false,
  maxTicketsPerOrder: 8,
  checkout: { enabled: true, timeoutMinutes: 15 },
  supportedCurrencies: ['USD', 'EUR', 'COP'],
}

describe('settingsValidationSchema', () => {
  it('accepts the documented canonical settings', async () => {
    await expect(settingsValidationSchema.validate(settings)).resolves.toBeTruthy()
  })

  it.each([
    ['maxTicketsPerOrder', { ...settings, maxTicketsPerOrder: 0 }],
    ['maxTicketsPerOrder', { ...settings, maxTicketsPerOrder: 1.5 }],
    ['checkout.timeoutMinutes', {
      ...settings,
      checkout: { ...settings.checkout, timeoutMinutes: 0 },
    }],
    ['supportedCurrencies', { ...settings, supportedCurrencies: [] }],
    ['supportedCurrencies', { ...settings, supportedCurrencies: ['USD', 'USD'] }],
    ['supportedCurrencies[0]', { ...settings, supportedCurrencies: ['usd'] }],
  ])('rejects invalid %s values', async (_, values) => {
    await expect(settingsValidationSchema.validate(values)).rejects.toBeTruthy()
  })
})

describe('buildSettingsUpdate', () => {
  it('returns an empty update when the form is unchanged', () => {
    expect(buildSettingsUpdate(settings, toFormValues(settings))).toEqual({})
  })

  it('only includes changed top-level fields', () => {
    const values: SettingsFormValues = {
      ...toFormValues(settings),
      theme: 'light',
      maxTicketsPerOrder: 4,
    }

    expect(buildSettingsUpdate(settings, values)).toEqual({
      theme: 'light',
      maxTicketsPerOrder: 4,
    })
  })

  it('only includes changed checkout fields and normalizes currencies', () => {
    const values: SettingsFormValues = {
      ...toFormValues(settings),
      checkout: { enabled: false, timeoutMinutes: 15 },
      supportedCurrencies: [' usd ', 'eur'],
    }

    expect(buildSettingsUpdate(settings, values)).toEqual({
      checkout: { enabled: false },
      supportedCurrencies: ['USD', 'EUR'],
    })
  })
})
