import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { inject } from '@vercel/analytics'
import './index.css'
import App from './App.jsx'
import configValidator from './utils/configValidator'

// Validate configuration on startup
configValidator.logResults();

// Vercel Analytics — only active in production (no-op in dev)
inject();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
