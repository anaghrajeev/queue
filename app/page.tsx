
"use client"
import { Provider as ToastProvider } from '@radix-ui/react-toast'
import React from 'react'
import CheckInPage from './check-in/page'
import { Provider } from 'react-redux'
import store from './Redux/store/store'
import WaitingStatusPage from './waiting-status/page'

function App() {
  return (
    <Provider store={store}>
        <CheckInPage />
    </Provider>
  )
}

export default App