import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getSettings, postSettings, toApiFailure } from '../../api/client'
import type {
  ApiFailure,
  RequestStatus,
  SettingsResponse,
  SettingsUpdate,
} from '../../types/api'

interface SettingsState {
  data: SettingsResponse | null
  loadStatus: RequestStatus
  saveStatus: RequestStatus
  loadError: ApiFailure | null
  saveError: ApiFailure | null
}

const initialState: SettingsState = {
  data: null,
  loadStatus: 'idle',
  saveStatus: 'idle',
  loadError: null,
  saveError: null,
}

export const fetchSettings = createAsyncThunk<
  SettingsResponse,
  void,
  { rejectValue: ApiFailure }
>('settings/fetchSettings', async (_, { rejectWithValue }) => {
  try {
    return await getSettings()
  } catch (error) {
    return rejectWithValue(toApiFailure(error))
  }
})

export const updateSettings = createAsyncThunk<
  SettingsResponse,
  SettingsUpdate,
  { rejectValue: ApiFailure }
>('settings/updateSettings', async (update, { rejectWithValue }) => {
  try {
    return await postSettings(update)
  } catch (error) {
    return rejectWithValue(toApiFailure(error))
  }
})

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    clearSaveError(state) {
      state.saveError = null
      if (state.saveStatus === 'failed') state.saveStatus = 'idle'
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loadStatus = 'loading'
        state.loadError = null
      })
      .addCase(fetchSettings.fulfilled, (state, action) =>
        ({
          ...(state as unknown as SettingsState),
          loadStatus: 'succeeded',
          data: action.payload,
        }) as SettingsState,
      )
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loadStatus = 'failed'
        state.loadError = action.payload ?? {
          status: null,
          code: 'UNKNOWN_ERROR',
          message: action.error.message ?? 'Unable to load settings.',
        }
      })
      .addCase(updateSettings.pending, (state) => {
        state.saveStatus = 'loading'
        state.saveError = null
      })
      .addCase(updateSettings.fulfilled, (state, action) =>
        ({
          ...(state as unknown as SettingsState),
          saveStatus: 'succeeded',
          data: action.payload,
        }) as SettingsState,
      )
      .addCase(updateSettings.rejected, (state, action) => {
        state.saveStatus = 'failed'
        state.saveError = action.payload ?? {
          status: null,
          code: 'UNKNOWN_ERROR',
          message: action.error.message ?? 'Unable to save settings.',
        }
      })
  },
})

export const { clearSaveError } = settingsSlice.actions
export default settingsSlice.reducer
