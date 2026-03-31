import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import { queryClient } from './queryClient.js'
import { ThemeProvider } from './theme/ThemeContext.jsx'
import { LanguageProvider } from './i18n/LanguageContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
