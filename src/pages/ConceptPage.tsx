import { Suspense, lazy, useMemo, type ComponentType } from 'react'
import { Link, useParams } from 'react-router'
import { MDXProvider } from '@mdx-js/react'
import type { MDXComponents } from 'mdx/types'
import { BY_SLUG, neighbours, trackOf, unlockedBy } from '../lib/curriculum'
import { useApp } from '../lib/store'
import { usePageMeta } from '../lib/meta'
import * as mdxComponents from '../components/content'
import DynamicQuiz from '../components/DynamicQuiz'
import PaperCard from '../components/PaperCard'
import NotFound from './NotFound'

const pages = import.meta.glob<{ default: ComponentType }>('../content/*.mdx')
const components = { ...mdxComponents, Quiz: DynamicQuiz } as unknown as MDXComponents

/**
 * Um `lazy()` por slug, guardado fora do componente e para sempre.
 *
 * Criar o lazy durante o render (mesmo dentro de useMemo) quebra a navegação
 * entre capítulos: o React descarta o render que suspende, o useMemo do fiber
 * descartado vai junto, a tentativa seguinte cria outro lazy que suspende de
 * novo, e o ciclo não fecha. Como a troca de rota é uma transition, a tela
 * fica exibindo o capítulo anterior — a URL muda e o conteúdo não.
 */
const lazyPages = new Map<string, ComponentType>()

function pageComponent(slug: string): ComponentType | null {
  const cached = lazyPages.get(slug)
  if (cached) return cached
  const load = pages[`../content/${slug}.mdx`]
  if (!load) return null
  const Component = lazy(load)
  lazyPages.set(slug, Component)
  return Component
}

const cx = (...p: (string | false | null | undefined)[]) => p.filter(Boolean).join(' ')

export default function ConceptPage() {
  const { slug = '' } = useParams()
  const concept = BY_SLUG[slug]
  const { isDone, toggleDone } = useApp()

  const Body = useMemo(() => pageComponent(slug), [slug])

  usePageMeta({
    title: concept?.title ?? 'Página não encontrada',
    description: concept?.tagline,
  })

  if (!concept) return <NotFound />

  const track = trackOf(concept)
  const { prev, next } = neighbours(slug)
  const opens = unlockedBy(slug)
  const done = isDone(slug)

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-8 sm:py-12">
      {/* ── header ──────────────────────────────────────────────────────── */}
      <header className="mb-9">
        <Link
          to={`/t/${track.slug}`}
          className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold tracking-wide uppercase"
          style={{ color: track.hex }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: track.hex }}
            aria-hidden="true"
          />
          {track.kind === 'papers' ? track.title : `Trilha ${track.n} · ${track.title}`}
        </Link>

        <h1 className="text-3xl leading-tight font-bold tracking-tight text-ink sm:text-4xl">
          {concept.title}
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-muted">{concept.tagline}</p>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-faint">
          <span>≈ {concept.min} min</span>
          {concept.demo && <span className="text-accent">demo interativo</span>}
          {concept.prereqs && concept.prereqs.length > 0 && (
            <span className="flex flex-wrap items-center gap-1.5">
              antes disso:
              {concept.prereqs.map((p) => (
                <Link
                  key={p}
                  to={`/c/${p}`}
                  className="rounded-md border border-line px-1.5 py-0.5 text-muted hover:border-accent/50 hover:text-accent"
                >
                  {BY_SLUG[p]?.title ?? p}
                </Link>
              ))}
            </span>
          )}
        </div>

        {concept.paper && <PaperCard paper={concept.paper} />}
      </header>

      {/* ── body ────────────────────────────────────────────────────────── */}
      <div className="prose">
        <MDXProvider components={components}>
          <Suspense fallback={<div className="py-16 text-sm text-faint">carregando conteúdo…</div>}>
            {Body ? (
              <Body />
            ) : (
              <p className="text-muted">
                Este capítulo ainda não foi escrito. Ele existe no índice porque faz parte da trilha
                — volte depois.
              </p>
            )}
          </Suspense>
        </MDXProvider>
      </div>

      {/* ── footer ──────────────────────────────────────────────────────── */}
      <div className="mt-12 border-t border-line pt-6">
        <button
          type="button"
          onClick={() => toggleDone(slug)}
          className={cx(
            'w-full rounded-xl border px-4 py-3 text-sm transition-colors sm:w-auto',
            done
              ? 'border-emerald/50 bg-emerald/10 text-emerald'
              : 'border-line bg-surface-2 text-muted hover:border-accent/50 hover:text-ink',
          )}
        >
          {done ? '✓ Concluído — clique para desmarcar' : 'Marcar como concluído'}
        </button>

        {opens.length > 0 && (
          <div className="mt-6 text-sm">
            <div className="mb-2 text-[11px] tracking-wide text-faint uppercase">Isso destrava</div>
            <div className="flex flex-wrap gap-2">
              {opens.map((c) => (
                <Link
                  key={c.slug}
                  to={`/c/${c.slug}`}
                  title={c.tagline}
                  className="rounded-lg border border-line px-2.5 py-1.5 text-muted hover:border-accent/50 hover:text-accent"
                >
                  {c.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        <nav className="mt-8 grid gap-3 sm:grid-cols-2">
          {prev ? (
            <Link
              to={`/c/${prev.slug}`}
              className="group rounded-xl border border-line p-4 transition-colors hover:border-accent/50"
            >
              <div className="text-xs text-faint">← anterior</div>
              <div className="mt-0.5 text-sm font-medium text-ink group-hover:text-accent">
                {prev.title}
              </div>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              to={`/c/${next.slug}`}
              className="group rounded-xl border border-line p-4 text-right transition-colors hover:border-accent/50"
            >
              <div className="text-xs text-faint">próximo →</div>
              <div className="mt-0.5 text-sm font-medium text-ink group-hover:text-accent">
                {next.title}
              </div>
            </Link>
          )}
        </nav>
      </div>
    </article>
  )
}
