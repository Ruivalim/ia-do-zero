import { Link } from 'react-router'
import { BY_SLUG, CONCEPTS, TRACKS, conceptsOf, trackOf } from '../lib/curriculum'
import { useApp } from '../lib/store'

/**
 * The prerequisite graph, laid out by track as columns of cards with the
 * dependency edges drawn as a simple list per card. A force-directed graph
 * looks impressive and reads terribly on a phone, so this is deliberately flat.
 */
export default function MapPage() {
  const { done } = useApp()

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-ink">Mapa do curso</h1>
      <p className="mt-3 max-w-2xl text-muted">
        As {CONCEPTS.length} páginas e o que cada uma exige antes. Dá pra pular à vontade — só
        espere ter que voltar quando aparecer um termo que ainda não foi apresentado.
      </p>

      <div className="mt-10 flex flex-col gap-12">
        {TRACKS.map((track) => (
          <section key={track.id}>
            <div className="mb-4 flex items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: track.hex }}
                aria-hidden="true"
              />
              <h2 className="text-sm font-semibold tracking-wide uppercase" style={{ color: track.hex }}>
                {track.n}. {track.title}
              </h2>
              <Link
                to={`/t/${track.slug}`}
                className="ml-auto text-xs text-faint hover:text-accent"
              >
                abrir trilha →
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {conceptsOf(track.id).map((c) => (
                <Link
                  key={c.slug}
                  to={`/c/${c.slug}`}
                  className="flex flex-col rounded-xl border border-line bg-surface p-3.5 transition-colors hover:border-accent/50"
                >
                  <span className="flex items-start gap-2">
                    <span className="min-w-0 flex-1 text-sm font-medium text-ink">{c.title}</span>
                    {done[c.slug] && <span className="text-xs text-emerald">✓</span>}
                  </span>
                  <span className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-faint">
                    {c.tagline}
                  </span>
                  {c.prereqs && c.prereqs.length > 0 && (
                    <span className="mt-2.5 flex flex-wrap gap-1 border-t border-line pt-2.5">
                      {c.prereqs.map((p) => {
                        const dep = BY_SLUG[p]
                        return (
                          <span
                            key={p}
                            className="rounded border px-1 py-0.5 text-[10px] text-faint"
                            style={{
                              borderColor: dep ? `${trackOf(dep).hex}55` : 'var(--c-border)',
                            }}
                          >
                            ← {dep?.title ?? p}
                          </span>
                        )
                      })}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
