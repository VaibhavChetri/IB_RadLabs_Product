import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface ThemeState {
  mode: 'light' | 'dark'
  primaryColor: 'default' | 'blue' | 'red'
}

const initialState: ThemeState = {
  mode: 'light',
  primaryColor: 'default',
}

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleMode: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light'
    },
    setMode: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.mode = action.payload
    },
    setPrimaryColor: (state, action: PayloadAction<'default' | 'blue' | 'red'>) => {
      state.primaryColor = action.payload
    },
  },
})

export const { toggleMode, setMode, setPrimaryColor } = themeSlice.actions

