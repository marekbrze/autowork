import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/shared/components/AppShell'
import { DashboardHome } from '@/shared/components/DashboardHome'
import { ModulePlaceholder } from '@/shared/components/ModulePlaceholder'
import { DevToolbar } from '@/shared/components/DevToolbar'

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          {/* Home / Dashboard */}
          <Route index element={<DashboardHome />} />
          <Route path="/dashboard" element={<DashboardHome />} />
          {/* Module routes — proto-lofi replaces these placeholders */}
          <Route path="/:moduleName" element={<ModulePlaceholder />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
      <DevToolbar />
    </BrowserRouter>
  )
}

export default App
