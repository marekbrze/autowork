import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useActiveRun } from '@/shared/active-run';
import { useRuns } from '@/modules/run/hooks/use-runs';

/**
 * Guard for funnel routes (`/capture`, `/decompose`, `/process`, `/focus`): without a valid active Run
 * (no `activeRunId`, or it points to a deleted/archived Run) → redirect to the Dashboard
 * (ADR 0044, PR-1). The funnel requires an active Run to scope its data.
 */
export function RequireActiveRun({ children }: { children: ReactNode }) {
  const { activeRunId } = useActiveRun();
  const { runs } = useRuns();
  const valid =
    !!activeRunId && runs.some((r) => r.id === activeRunId && r.state === 'in_progress');
  if (!valid) return <Navigate to="/" replace />;
  return <>{children}</>;
}
