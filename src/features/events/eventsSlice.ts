import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getEvents, toApiFailure } from '../../api/client'
import type { ApiFailure, EventResponse, RequestStatus } from '../../types/api'

interface EventsState {
  items: EventResponse[]
  status: RequestStatus
  error: ApiFailure | null
}

const initialState: EventsState = {
  items: [],
  status: 'idle',
  error: null,
}

export const fetchEvents = createAsyncThunk<
  EventResponse[],
  void,
  { rejectValue: ApiFailure }
>('events/fetchEvents', async (_, { rejectWithValue }) => {
  try {
    const events = await getEvents()
    return [...events].sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
  } catch (error) {
    return rejectWithValue(toApiFailure(error))
  }
})

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? {
          status: null,
          code: 'UNKNOWN_ERROR',
          message: action.error.message ?? 'Unable to load events.',
        }
      })
  },
})

export default eventsSlice.reducer
