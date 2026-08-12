import * as yup from 'yup'
import type { CoreSettings, SettingsUpdate, Theme } from '../../types/api'

export interface SettingsFormValues {
  theme: Theme
  maintenanceMode: boolean
  maxTicketsPerOrder: number | ''
  checkout: {
    enabled: boolean
    timeoutMinutes: number | ''
  }
  supportedCurrencies: string[]
}

const positiveInteger = yup
  .number()
  .typeError('Must be a number')
  .integer('Must be a whole number')
  .positive('Must be greater than zero')
  .required('Required')

export const settingsValidationSchema = yup.object({
  theme: yup
    .mixed<Theme>()
    .oneOf(['light', 'dark'], 'Choose a valid theme')
    .required('Required'),
  maintenanceMode: yup.boolean().required(),
  maxTicketsPerOrder: positiveInteger,
  checkout: yup.object({
    enabled: yup.boolean().required(),
    timeoutMinutes: positiveInteger,
  }),
  supportedCurrencies: yup
    .array()
    .of(
      yup
        .string()
        .required('Currency code is required')
        .matches(/^[A-Z]{3}$/, 'Use a three-letter uppercase code'),
    )
    .min(1, 'Add at least one currency')
    .test('unique', 'Currency codes must be unique', (values) => {
      if (!values) return true
      return new Set(values).size === values.length
    }),
})

export const toFormValues = (settings: CoreSettings): SettingsFormValues => ({
  theme: settings.theme,
  maintenanceMode: settings.maintenanceMode,
  maxTicketsPerOrder: settings.maxTicketsPerOrder,
  checkout: {
    enabled: settings.checkout.enabled,
    timeoutMinutes: settings.checkout.timeoutMinutes,
  },
  supportedCurrencies: [...settings.supportedCurrencies],
})

export const normalizeCurrencies = (currencies: string[]): string[] =>
  currencies.map((currency) => currency.trim().toUpperCase()).filter(Boolean)

const arraysEqual = (left: string[], right: string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index])

export function buildSettingsUpdate(
  initial: CoreSettings,
  values: SettingsFormValues,
): SettingsUpdate {
  const update: SettingsUpdate = {}
  const currencies = normalizeCurrencies(values.supportedCurrencies)

  if (values.theme !== initial.theme) update.theme = values.theme
  if (values.maintenanceMode !== initial.maintenanceMode) {
    update.maintenanceMode = values.maintenanceMode
  }
  if (values.maxTicketsPerOrder !== initial.maxTicketsPerOrder) {
    update.maxTicketsPerOrder = Number(values.maxTicketsPerOrder)
  }
  if (!arraysEqual(currencies, initial.supportedCurrencies)) {
    update.supportedCurrencies = currencies
  }

  const checkout: SettingsUpdate['checkout'] = {}
  if (values.checkout.enabled !== initial.checkout.enabled) {
    checkout.enabled = values.checkout.enabled
  }
  if (values.checkout.timeoutMinutes !== initial.checkout.timeoutMinutes) {
    checkout.timeoutMinutes = Number(values.checkout.timeoutMinutes)
  }
  if (Object.keys(checkout).length > 0) update.checkout = checkout

  return update
}
