import { Link, useParams } from 'react-router'
import { TRACKS, conceptsOf } from '../lib/curriculum'
import { useApp } from '../lib/store'
import { usePageMeta } from '../lib/meta'
import NotFound from './NotFound'

export default function TrackPage() {
  const { trackSlug = '' } = useParams()
  const track = TRACKS.find((t) => t.slug === trackSlug)
  const { done } = useApp()

  usePageMeta({
    title: !track
      ? 'Página não encontrada'
      : track.kind === 'papers'
        ? track.title
        : `Trilha ${track.n} · ${track.title}`,
    description: track?.tagline,
  })

  if (!track) return <NotFound />

  const items = conceptsOf(track.id)
  const minutes = items.reduce((a, c) => a + c.min, 0)
  // prev/next stays inside the same kind: the course never spills into the shelf
  const siblings = TRACKS.filter((t) => t.kind === track.kind)
  const nextTrack = siblings[siblings.indexOf(track) + 1]

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-8 sm:py-14">
      <header className="mb-10">
        <div
          className="mb-3 text-[11px] font-semibold tracking-[0.14em] uppercase"
          style={{ color: track.hex }}
        >
          {track.kind === 'papers' ? 'Estante' : `Trilha ${track.n}`}
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{track.title}</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted">{track.tagline}</p>
        <div className="mt-4 flex gap-4 text-xs text-faint">
          <span>
            {items.length} {track.kind === 'papers' ? 'papers' : 'conceitos'}
          </span>
          <span>{items.filter((c) => c.demo).length} demos</span>
          <span>≈ {minutes} min</span>
        </div>
      </header>

      <ol className="flex flex-col gap-3">
        {items.map((c, i) => (
          <li key={c.slug}>
            <Link
              to={`/c/${c.slug}`}
              className="group flex gap-4 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-[color-mix(in_oklab,var(--tc)_50%,transparent)]"
              style={{ ['--tc' as string]: track.hex }}
            >
              <span
                className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border font-mono text-xs"
                style={{
                  borderColor: done[c.slug] ? 'var(--c-emerald)' : 'var(--c-border)',
                  color: done[c.slug] ? 'var(--c-emerald)' : track.hex,
                }}
              >
                {done[c.slug] ? '✓' : i + 1}
              </span>
              <span className="min-w-0">
                <span className="block font-medium text-ink group-hover:text-accent">
                  {c.title}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-muted">{c.tagline}</span>
                <span className="mt-2 flex flex-wrap gap-3 text-[11px] text-faint">
                  <span>{c.min} min</span>
                  {c.demo && <span className="text-accent">demo</span>}
                  {c.paper && (
                    <span>
                      {c.paper.authors} · {c.paper.year}
                    </span>
                  )}
                  {c.paper?.pdfUrl && <span className="text-teal">PDF</span>}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      {nextTrack && (
        <Link
          to={`/t/${nextTrack.slug}`}
          className="mt-10 block rounded-xl border border-line p-4 text-right transition-colors hover:border-accent/50"
        >
          <div className="text-xs text-faint">próxima trilha →</div>
          <div className="mt-0.5 font-medium text-ink">
            {nextTrack.n}. {nextTrack.title}
          </div>
        </Link>
      )}
    </div>
  )
}
