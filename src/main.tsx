import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { migrateGlobalFunnelData } from '@/shared/migrate'

// Migruj stare globalne dane lejka do modelu per-Run (ADR 0044) ZANIM hooki przeczytają storage.
migrateGlobalFunnelData()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
