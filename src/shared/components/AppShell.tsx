import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

/**
 * App shell — top bar + contained content slot.
 * Structural only (neutral shadcn defaults). Visual/aesthetic direction
 * (arcade vibe, colors, big buttons) is applied by `proto-design`.
 *
 * Flow-oriented navigation: the top bar exposes only `Dashboard`.
 * Funnel steps (capture/decompose/process/focus) are guided within a Run
 * via a progress stepper (built by proto-lofi), not free nav links.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4">
          <Link
            to="/"
            className="font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Autowork
          </Link>
          <nav aria-label="Główna nawigacja" className="flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  isActive && 'bg-muted text-foreground',
                )
              }
            >
              Dashboard
            </NavLink>
          </nav>
          {/* Right slot reserved for the active-Run chip / user menu (wired by proto-lofi) */}
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>
      </main>
    </div>
  )
}
