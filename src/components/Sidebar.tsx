import { NavLink } from 'react-router'
import { CONCEPTS, TRACKS, conceptsOf } from '../lib/curriculum'
import { useApp } from '../lib/store'

const cx = (...p: (string | false | null | undefined)[]) => p.filter(Boolean).join(' ')

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { done } = useApp()
  const total = CONCEPTS.length
  const finished = CONCEPTS.filter((c) => done[c.slug]).length
  const pct = Math.round((finished / total) * 100)

  return (
    <nav className="flex h-full flex-col" aria-label="Trilhas do curso">
      <div className="px-4 pt-4 pb-3">
        <div className="mb-1.5 flex items-baseline justify-between text-xs">
          <span className="text-faint">progresso</span>
          <span className="font-mono text-muted">
            {finished}/{total}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-2 pb-8">
        {TRACKS.map((track) => {
          const items = conceptsOf(track.id)
          const doneCount = items.filter((c) => done[c.slug]).length
          return (
            <section key={track.id} className="mb-5">
              <NavLink
                to={`/t/${track.slug}`}
                onClick={onNavigate}
                className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-2"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: track.hex }}
                  aria-hidden="true"
                />
                <span className="text-[11px] font-semibold tracking-wide text-faint uppercase group-hover:text-muted">
                  {track.n}. {track.title}
                </span>
                <span className="ml-auto font-mono text-[10px] text-faint">
                  {doneCount}/{items.length}
                </span>
              </NavLink>

              <ul className="mt-1 ml-[7px] flex flex-col border-l border-line pl-3">
                {items.map((c) => (
                  <li key={c.slug}>
                    <NavLink
                      to={`/c/${c.slug}`}
                      onClick={onNavigate}
                      title={c.tagline}
                      className={({ isActive }) =>
                        cx(
                          'relative flex items-center gap-2 rounded-md py-1.5 pr-2 pl-2 text-sm transition-colors',
                          isActive
                            ? 'bg-surface-2 font-medium text-ink'
                            : 'text-muted hover:bg-surface-2/60 hover:text-ink',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span
                              className="absolute top-1.5 bottom-1.5 -left-[13px] w-[2px] rounded-full"
                              style={{ background: track.hex }}
                              aria-hidden="true"
                            />
                          )}
                          <span className="min-w-0 flex-1 truncate">{c.title}</span>
                          {done[c.slug] && (
                            <span className="text-[10px] text-emerald" aria-label="concluído">
                              ✓
                            </span>
                          )}
                          {c.demo && (
                            <span
                              className="h-1 w-1 rounded-full bg-accent/70"
                              title="tem demo interativo"
                              aria-hidden="true"
                            />
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}

        <div className="mt-2 flex flex-col gap-1 border-t border-line px-2 pt-4">
          <NavLink
            to="/mapa"
            onClick={onNavigate}
            className={({ isActive }) =>
              cx(
                'rounded-md px-2 py-1.5 text-sm',
                isActive ? 'bg-surface-2 text-ink' : 'text-muted hover:text-ink',
              )
            }
          >
            Mapa do curso
          </NavLink>
          <NavLink
            to="/glossario"
            onClick={onNavigate}
            className={({ isActive }) =>
              cx(
                'rounded-md px-2 py-1.5 text-sm',
                isActive ? 'bg-surface-2 text-ink' : 'text-muted hover:text-ink',
              )
            }
          >
            Glossário
          </NavLink>
        </div>
      </div>
    </nav>
  )
}
