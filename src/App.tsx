import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/shared/components/AppShell'
import { ModulePlaceholder } from '@/shared/components/ModulePlaceholder'
import { DevToolbar } from '@/shared/components/DevToolbar'
import { RequireActiveRun } from '@/shared/components/RequireActiveRun'
import { ActiveRunProvider } from '@/shared/active-run'
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
  // basename mirrors vite.config.ts `base` so routes resolve under the deploy path
  // (GitHub project Pages: <user>.github.io/<repo>/). import.meta.env.BASE_URL keeps
  // router and build in sync — see docs/changes/dashboard-blank-on-pages.md.
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ActiveRunProvider>
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
            {/* capture — built by proto-lofi (guard: wymaga aktywnego Runa, ADR 0044) */}
            <Route
              path="/capture"
              element={
                <RequireActiveRun>
                  <BrainDump />
                </RequireActiveRun>
              }
            />
            <Route
              path="/capture/ranking"
              element={
                <RequireActiveRun>
                  <Ranking />
                </RequireActiveRun>
              }
            />
            {/* decompose — built by proto-lofi */}
            <Route
              path="/decompose"
              element={
                <RequireActiveRun>
                  <DecomposeView />
                </RequireActiveRun>
              }
            />
            {/* process — built by proto-lofi */}
            <Route
              path="/process"
              element={
                <RequireActiveRun>
                  <ProcessView />
                </RequireActiveRun>
              }
            />
            {/* focus — built by proto-lofi */}
            <Route
              path="/focus"
              element={
                <RequireActiveRun>
                  <FocusView />
                </RequireActiveRun>
              }
            />
            {/* Other module routes — proto-lofi replaces these placeholders */}
            <Route path="/:moduleName" element={<ModulePlaceholder />} />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
        <DevToolbar />
      </ActiveRunProvider>
    </BrowserRouter>
  )
}

export default App
