import { Link, useParams } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

/** Display labels (Polish) for module code names (English, from MODULES.md). */
const MODULE_LABELS: Record<string, string> = {
  capture: 'Stresory',
  decompose: 'Next actions',
  process: 'Procesowanie',
  focus: 'Focus',
  run: 'Run',
  dashboard: 'Dashboard',
}

/**
 * Placeholder for a module route. proto-lofi replaces each route with the
 * module's real screens; this just confirms routing works end-to-end.
 */
export function ModulePlaceholder() {
  const { moduleName = '' } = useParams()
  const label = MODULE_LABELS[moduleName] ?? moduleName

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight">{label}</h1>
      <p className="text-muted-foreground">
        Moduł{' '}
        <code className="rounded bg-muted px-1 py-0.5 text-sm">{moduleName}</code> — ekrany do
        zbudowania w <code>proto-lofi</code>.
      </p>
      <Link to="/" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
        ← Wróć do Dashboardu
      </Link>
    </div>
  )
}
