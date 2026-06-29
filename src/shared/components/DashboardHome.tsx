import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

/**
 * Home / Dashboard placeholder.
 * Structural stub: active-Run progress + recent runs + primary CTA.
 * proto-lofi replaces this with real run data from the scenario system.
 */
export function DashboardHome() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Tu pojawi się progres aktywnego Runa i historia przejazdów.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/capture"
            className={cn(buttonVariants({ variant: 'default', size: 'lg' }))}
          >
            Zacznij nowy Run
          </Link>
          <Link
            to="/run"
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            Moje Runy
          </Link>
        </div>
      </section>

      {/* Placeholder grid — proto-lofi fills with real run data (scenarios). */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Podsumowanie">
        <SummaryCard label="Aktywny Run" hint="progres · proto-lofi" />
        <SummaryCard label="Ostatnie Runy" hint="historia · proto-lofi" />
        <SummaryCard label="Łączny czas w focus" hint="motywacja · proto-lofi" />
      </section>
    </div>
  )
}

function SummaryCard({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </div>
  )
}
