import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/shared/components/AppShell'
import { ModulePlaceholder } from '@/shared/components/ModulePlaceholder'
import { DevToolbar } from '@/shared/components/DevToolbar'
import { DashboardView } from '@/modules/dashboard'
import { BrainDump } from '@/modules/capture/components/BrainDump'
import { Ranking } from '@/modules/capture/components/Ranking'
import { DecomposeView } from '@/modules/decompose/components/DecomposeView'
import { ProcessView } from '@/modules/process/components/ProcessView'
import { FocusView } from '@/modules/focus/components/FocusView'
import { RunDetails } from '@/modules/run/components/RunDetails'
import { ArchivedRuns } from '@/modules/run/components/ArchivedRuns'
import { ReviewRun } from '@/modules/run/components/ReviewRun'

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          {/* Home / Dashboard — launcher (runway). Dashboard module owns it (ADR 0026). */}
          <Route index element={<DashboardView />} />
          <Route path="/dashboard" element={<DashboardView />} />
          {/* /run redirects home — single launcher (dashboard supersedes the flat list). */}
          <Route path="/run" element={<Navigate to="/" replace />} />
          {/* run — lifecycle + stats + management (ADR 0020). */}
          <Route path="/run/archived" element={<ArchivedRuns />} />
          <Route path="/run/:runId/review" element={<ReviewRun />} />
          <Route path="/run/:runId" element={<RunDetails />} />
          {/* capture — built by proto-lofi */}
          <Route path="/capture" element={<BrainDump />} />
          <Route path="/capture/ranking" element={<Ranking />} />
          {/* decompose — built by proto-lofi */}
          <Route path="/decompose" element={<DecomposeView />} />
          {/* process — built by proto-lofi */}
          <Route path="/process" element={<ProcessView />} />
          {/* focus — built by proto-lofi */}
          <Route path="/focus" element={<FocusView />} />
          {/* Other module routes — proto-lofi replaces these placeholders */}
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
