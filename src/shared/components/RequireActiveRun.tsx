import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useActiveRun } from '@/shared/active-run';
import { useRuns } from '@/modules/run/hooks/use-runs';

/**
 * Guard tras lejka (`/capture`, `/decompose`, `/process`, `/focus`): bez ważnego aktywnego Runa
 * (brak `activeRunId`, albo wskazuje na usunięty/zarchiwizowany Run) → przekieruj na Dashboard
 * (ADR 0044, PR-1). Lejek wymaga aktywnego Runa, którego dane scope'uje.
 */
export function RequireActiveRun({ children }: { children: ReactNode }) {
  const { activeRunId } = useActiveRun();
  const { runs } = useRuns();
  const valid =
    !!activeRunId && runs.some((r) => r.id === activeRunId && r.state === 'in_progress');
  if (!valid) return <Navigate to="/" replace />;
  return <>{children}</>;
}
