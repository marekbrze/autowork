import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { migrateGlobalFunnelData } from '@/shared/migrate'

// Migrate old global funnel data to the per-Run model (ADR 0044) BEFORE the hooks read storage.
migrateGlobalFunnelData()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
