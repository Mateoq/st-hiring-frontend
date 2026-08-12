import { useEffect, useState } from 'react'
import { Formik, Form, useFormikContext } from 'formik'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import type { ApiFailure } from '../../types/api'
import { fetchSettings, updateSettings } from './settingsSlice'
import {
  buildSettingsUpdate,
  normalizeCurrencies,
  settingsValidationSchema,
  toFormValues,
  type SettingsFormValues,
} from './settingsForm'

interface SettingsViewProps {
  onDirtyChange: (dirty: boolean) => void
}

function DirtyReporter({ onDirtyChange }: SettingsViewProps) {
  const { dirty } = useFormikContext<SettingsFormValues>()

  useEffect(() => {
    onDirtyChange(dirty)
    return () => onDirtyChange(false)
  }, [dirty, onDirtyChange])

  return null
}

const getFieldPath = (path: string) => path.replace(/^body\./, '')

const formatUpdatedAt = (value: string | null) => {
  if (!value) return 'Not saved yet'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default function SettingsView({ onDirtyChange }: SettingsViewProps) {
  const dispatch = useAppDispatch()
  const { data, loadStatus, saveStatus, loadError, saveError } = useAppSelector(
    (state) => state.settings,
  )
  const [successOpen, setSuccessOpen] = useState(false)

  if ((loadStatus === 'idle' || loadStatus === 'loading') && !data) {
    return (
      <Stack spacing={2} aria-label="Loading settings">
        <Skeleton variant="text" width={240} height={48} />
        <Skeleton variant="rounded" height={420} />
      </Stack>
    )
  }

  if (loadStatus === 'failed' && !data) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => void dispatch(fetchSettings())}>
            Retry
          </Button>
        }
      >
        {loadError?.message ?? 'Unable to load settings.'}
      </Alert>
    )
  }

  if (!data) return null

  const initialValues = toFormValues(data.settings)

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1">
          Settings
        </Typography>
        <Typography color="text.secondary">
          Configure the ticketing experience. Last updated: {formatUpdatedAt(data.updatedAt)}
        </Typography>
      </Box>

      <Formik<SettingsFormValues>
        initialValues={initialValues}
        enableReinitialize
        validationSchema={settingsValidationSchema}
        onSubmit={async (values, helpers) => {
          const normalizedValues = {
            ...values,
            supportedCurrencies: normalizeCurrencies(values.supportedCurrencies),
          }
          const update = buildSettingsUpdate(data.settings, normalizedValues)

          try {
            const response = await dispatch(updateSettings(update)).unwrap()
            helpers.resetForm({ values: toFormValues(response.settings) })
            setSuccessOpen(true)
          } catch (failure) {
            const apiFailure = failure as ApiFailure
            apiFailure.details?.forEach((detail) => {
              helpers.setFieldError(getFieldPath(detail.path), detail.message)
            })
          }
        }}
      >
        {({
          values,
          errors,
          touched,
          dirty,
          handleBlur,
          handleChange,
          setFieldValue,
        }) => (
          <Form noValidate>
            <DirtyReporter onDirtyChange={onDirtyChange} />
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={4}>
                  {saveError && (
                    <Alert severity="error">
                      {saveError.message}
                    </Alert>
                  )}

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                      gap: 3,
                    }}
                  >
                    <FormControl
                      error={Boolean(touched.theme && errors.theme)}
                      fullWidth
                    >
                      <InputLabel id="theme-label">Theme</InputLabel>
                      <Select
                        labelId="theme-label"
                        id="theme"
                        name="theme"
                        label="Theme"
                        value={values.theme}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      >
                        <MenuItem value="dark">Dark</MenuItem>
                        <MenuItem value="light">Light</MenuItem>
                      </Select>
                      {touched.theme && errors.theme && (
                        <FormHelperText>{errors.theme}</FormHelperText>
                      )}
                    </FormControl>

                    <TextField
                      fullWidth
                      id="maxTicketsPerOrder"
                      name="maxTicketsPerOrder"
                      label="Maximum tickets per order"
                      type="number"
                      inputProps={{ min: 1, step: 1 }}
                      value={values.maxTicketsPerOrder}
                      onChange={(event) =>
                        void setFieldValue(
                          'maxTicketsPerOrder',
                          event.target.value === '' ? '' : Number(event.target.value),
                        )
                      }
                      onBlur={handleBlur}
                      error={Boolean(touched.maxTicketsPerOrder && errors.maxTicketsPerOrder)}
                      helperText={touched.maxTicketsPerOrder && errors.maxTicketsPerOrder}
                    />
                  </Box>

                  <FormControlLabel
                    control={
                      <Switch
                        name="maintenanceMode"
                        checked={values.maintenanceMode}
                        onChange={handleChange}
                      />
                    }
                    label="Maintenance mode"
                  />

                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Checkout
                    </Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr' },
                        gap: 3,
                        alignItems: 'center',
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Switch
                            name="checkout.enabled"
                            checked={values.checkout.enabled}
                            onChange={handleChange}
                          />
                        }
                        label="Checkout enabled"
                      />
                      <TextField
                        fullWidth
                        id="checkout.timeoutMinutes"
                        name="checkout.timeoutMinutes"
                        label="Checkout timeout (minutes)"
                        type="number"
                        inputProps={{ min: 1, step: 1 }}
                        value={values.checkout.timeoutMinutes}
                        onChange={(event) =>
                          void setFieldValue(
                            'checkout.timeoutMinutes',
                            event.target.value === '' ? '' : Number(event.target.value),
                          )
                        }
                        onBlur={handleBlur}
                        error={Boolean(
                          touched.checkout?.timeoutMinutes && errors.checkout?.timeoutMinutes,
                        )}
                        helperText={
                          touched.checkout?.timeoutMinutes && errors.checkout?.timeoutMinutes
                        }
                      />
                    </Box>
                  </Box>

                  <Autocomplete
                    multiple
                    freeSolo
                    filterSelectedOptions
                    options={[] as string[]}
                    value={values.supportedCurrencies}
                    onChange={(_, currencies) =>
                      void setFieldValue('supportedCurrencies', normalizeCurrencies(currencies))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Supported currencies"
                        placeholder="Type a code and press Enter"
                        error={Boolean(touched.supportedCurrencies && errors.supportedCurrencies)}
                        helperText={
                          touched.supportedCurrencies &&
                          (typeof errors.supportedCurrencies === 'string'
                            ? errors.supportedCurrencies
                            : 'Use unique three-letter uppercase codes')
                        }
                        onBlur={() => void setFieldValue('supportedCurrencies', values.supportedCurrencies, true)}
                      />
                    )}
                  />

                  <Stack direction="row" justifyContent="flex-end">
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={!dirty || saveStatus === 'loading'}
                    >
                      {saveStatus === 'loading' ? 'Saving…' : 'Save settings'}
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Form>
        )}
      </Formik>

      <Snackbar
        open={successOpen}
        autoHideDuration={4000}
        onClose={() => setSuccessOpen(false)}
        message="Settings saved"
      />
    </Stack>
  )
}
