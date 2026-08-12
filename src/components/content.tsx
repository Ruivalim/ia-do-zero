import { Suspense, useEffect, useId, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useApp } from '../lib/store'
import { BY_SLUG } from '../lib/curriculum'
import { GLOSSARY } from '../lib/glossary'
import { DEMOS } from '../demos/registry'
import DemoBoundary from './DemoBoundary'

const cx = (...p: (string | false | null | undefined)[]) => p.filter(Boolean).join(' ')

/* ────────────────────────────────────────────────────────────────────────────
   Components the MDX pages use. Available without importing — they are handed
   to the MDXProvider in ConceptPage.
   ──────────────────────────────────────────────────────────────────────────── */

/** The one-sentence answer. Always the first thing on a page. */
export function TLDR({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-accent/30 bg-accent/[0.06] p-4">
      <div className="mb-1 text-[11px] font-semibold tracking-wide text-accent uppercase">
        Em uma frase
      </div>
      <div className="text-[1.0625rem] leading-relaxed text-ink">{children}</div>
    </div>
  )
}

/** Everyday-life comparison. Deliberately imprecise; that is the point. */
export function Analogy({
  children,
  title = 'A analogia',
}: {
  children: ReactNode
  title?: string
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/50 p-4">
      <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold tracking-wide text-faint uppercase">
        <span aria-hidden="true">🧩</span>
        {title}
      </div>
      <div className="[&>p]:mt-0 [&>p+p]:mt-3">{children}</div>
    </div>
  )
}

const CALLOUT_TONES = {
  info: { border: 'border-blueish/35', bg: 'bg-blueish/[0.06]', text: 'text-blueish', icon: 'ℹ️' },
  warn: { border: 'border-amber/35', bg: 'bg-amber/[0.07]', text: 'text-amber', icon: '⚠️' },
  trap: { border: 'border-rose/35', bg: 'bg-rose/[0.06]', text: 'text-rose', icon: '🪤' },
  ok: { border: 'border-emerald/35', bg: 'bg-emerald/[0.06]', text: 'text-emerald', icon: '✅' },
} as const

/** Aside. `trap` is the common-mistake box every page should have one of. */
export function Callout({
  children,
  type = 'info',
  title,
}: {
  children: ReactNode
  type?: keyof typeof CALLOUT_TONES
  title?: string
}) {
  const t = CALLOUT_TONES[type]
  const defaults = { info: 'Nota', warn: 'Atenção', trap: 'Pegadinha comum', ok: 'Boa prática' }
  return (
    <div className={cx('rounded-xl border p-4', t.border, t.bg)}>
      <div
        className={cx(
          'mb-1.5 flex items-center gap-2 text-[11px] font-semibold tracking-wide uppercase',
          t.text,
        )}
      >
        <span aria-hidden="true">{t.icon}</span>
        {title ?? defaults[type]}
      </div>
      <div className="[&>p]:mt-0 [&>p+p]:mt-3 [&>ul]:mt-2">{children}</div>
    </div>
  )
}

/**
 * The technical layer. Collapsed while the global switch says "Simples",
 * open while it says "Técnico" — but the reader can always override locally.
 */
export function Deep({
  children,
  title = 'Por baixo do capô',
}: {
  children: ReactNode
  title?: string
}) {
  const { depth } = useApp()
  const [override, setOverride] = useState<boolean | null>(null)
  const open = override ?? depth === 'tecnico'

  return (
    <div className="overflow-hidden rounded-xl border border-violet/30 bg-violet/[0.04]">
      <button
        type="button"
        onClick={() => setOverride(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-violet/[0.06]"
      >
        <span
          className={cx('text-violet transition-transform duration-200', open && 'rotate-90')}
          aria-hidden="true"
        >
          ▶
        </span>
        <span className="text-[11px] font-semibold tracking-wide text-violet uppercase">
          {title}
        </span>
        <span className="ml-auto text-xs text-faint">{open ? 'ocultar' : 'mostrar'}</span>
      </button>
      {open && (
        <div className="fade-up border-t border-violet/20 px-4 py-4 [&>*:first-child]:mt-0">
          {children}
        </div>
      )}
    </div>
  )
}

/** Inline glossary term. Hover/tap shows the definition. */
export function Term({ id, children }: { id: string; children?: ReactNode }) {
  const entry = GLOSSARY[id]
  const [open, setOpen] = useState(false)
  if (!entry) return <>{children ?? id}</>
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="cursor-help border-b border-dotted border-accent/70 text-inherit"
      >
        {children ?? entry.term}
      </button>
      {open && (
        <span className="fade-up absolute bottom-full left-1/2 z-30 mb-2 w-64 -translate-x-1/2 rounded-lg border border-line bg-surface p-3 text-sm leading-normal font-normal text-muted shadow-[var(--shadow-card)]">
          <strong className="text-ink">{entry.term}</strong>
          <br />
          {entry.short}
        </span>
      )}
    </span>
  )
}

/** Link to another concept, rendered with its title and tagline. */
export function Ref({ to, children }: { to: string; children?: ReactNode }) {
  const c = BY_SLUG[to]
  if (!c) return <>{children ?? to}</>
  return (
    <Link to={`/c/${to}`} title={c.tagline} className="text-accent underline underline-offset-3">
      {children ?? c.title}
    </Link>
  )
}

/** Mounts an interactive demo by registry key, with a title and caption. */
export function Demo({ id, title, note }: { id: string; title?: string; note?: string }) {
  const entry = DEMOS[id]
  if (!entry) {
    return (
      <div className="rounded-xl border border-rose/40 bg-rose/[0.06] p-4 text-sm text-rose">
        Demo <code>{id}</code> não registrado.
      </div>
    )
  }
  const Component = entry.Component
  return (
    <figure className="not-prose my-7 overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-surface-2/50 px-4 py-2.5">
        <span
          className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-ink">{title ?? entry.title}</span>
        <span className="ml-auto text-[11px] tracking-wide text-faint uppercase">interativo</span>
      </div>
      <div className="p-4 sm:p-5">
        <Suspense
          fallback={
            <div className="flex h-48 items-center justify-center text-sm text-faint">
              carregando demo…
            </div>
          }
        >
          <DemoBoundary id={id}>
            <Component />
          </DemoBoundary>
        </Suspense>
      </div>
      {(note ?? entry.note) && (
        <figcaption className="border-t border-line bg-surface-2/30 px-4 py-2.5 text-xs leading-relaxed text-faint">
          {note ?? entry.note}
        </figcaption>
      )}
    </figure>
  )
}

/** Two-column comparison. `rows` is [aspect, left, right]. */
export function Versus({
  left,
  right,
  rows,
}: {
  left: string
  right: string
  rows: [string, string, string][]
}) {
  return (
    <div className="not-prose overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr className="bg-surface-2">
            <th className="w-1/5 px-3 py-2.5 text-left font-medium text-faint">—</th>
            <th className="px-3 py-2.5 text-left font-semibold text-accent">{left}</th>
            <th className="px-3 py-2.5 text-left font-semibold text-violet">{right}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([aspect, a, b]) => (
            <tr key={aspect} className="border-t border-line align-top">
              <td className="px-3 py-2.5 text-faint">{aspect}</td>
              <td className="px-3 py-2.5 text-ink">{a}</td>
              <td className="px-3 py-2.5 text-ink">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Numbered steps for a pipeline described in prose. */
export function Steps({ items }: { items: [string, string][] }) {
  return (
    <ol className="not-prose flex list-none flex-col gap-3 p-0">
      {items.map(([title, body], i) => (
        <li key={title} className="flex gap-3.5">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-accent/40 font-mono text-xs text-accent">
            {i + 1}
          </span>
          <div className="min-w-0">
            <div className="font-medium text-ink">{title}</div>
            <div className="text-sm leading-relaxed text-muted">{body}</div>
          </div>
        </li>
      ))}
    </ol>
  )
}

// ── quiz ────────────────────────────────────────────────────────────────────

export type QuizQ = {
  q: string
  options: string[]
  answer: number
  why: string
}

export function Quiz({
  questions,
  onRetry,
  onComplete,
}: {
  questions: QuizQ[]
  /** re-embaralha e zera as respostas; sem isso o bloco não oferece "tentar de novo" */
  onRetry?: () => void
  /** chamado uma vez, quando a última pergunta é respondida */
  onComplete?: (correct: number, total: number) => void
}) {
  const [picked, setPicked] = useState<Record<number, number>>({})
  const uid = useId()

  const done = questions.every((_, qi) => picked[qi] !== undefined)
  const correct = questions.reduce((n, item, qi) => n + (picked[qi] === item.answer ? 1 : 0), 0)

  useEffect(() => {
    if (done) onComplete?.(correct, questions.length)
  }, [done, correct, questions.length, onComplete])

  return (
    <section className="not-prose mt-10 rounded-2xl border border-line bg-surface p-5">
      <h2 className="mb-1 text-lg font-semibold text-ink">Checagem rápida</h2>
      <p className="mb-5 text-sm text-muted">
        Sem nota, sem cadastro. Errar aqui é mais barato que errar em produção.
      </p>
      <div className="flex flex-col gap-6">
        {questions.map((item, qi) => {
          const choice = picked[qi]
          const answered = choice !== undefined
          return (
            <div key={item.q}>
              <div id={`${uid}-q${qi}`} className="mb-2.5 font-medium text-ink">
                <span className="mr-1.5 font-mono text-sm text-faint">{qi + 1}.</span>
                {item.q}
              </div>
              <div role="group" aria-labelledby={`${uid}-q${qi}`} className="flex flex-col gap-1.5">
                {item.options.map((opt, oi) => {
                  const isRight = oi === item.answer
                  const isPicked = choice === oi
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={answered}
                      onClick={() => setPicked((p) => ({ ...p, [qi]: oi }))}
                      className={cx(
                        'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                        !answered && 'border-line hover:border-accent/50 hover:bg-surface-2',
                        answered && isRight && 'border-emerald/50 bg-emerald/10 text-ink',
                        answered && isPicked && !isRight && 'border-rose/50 bg-rose/10 text-ink',
                        answered && !isRight && !isPicked && 'border-line text-faint',
                      )}
                    >
                      <span className="mr-2 font-mono text-xs text-faint">
                        {String.fromCharCode(97 + oi)})
                      </span>
                      {opt}
                      {answered && isRight && (
                        <span className="ml-2 text-emerald">
                          ✓<span className="sr-only"> resposta correta</span>
                        </span>
                      )}
                      {answered && isPicked && !isRight && (
                        <span className="ml-2 text-rose">
                          ✗<span className="sr-only"> sua resposta, incorreta</span>
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              {answered && (
                <p
                  aria-live="polite"
                  className="fade-up mt-2.5 rounded-lg bg-surface-2 px-3 py-2 text-sm leading-relaxed text-muted"
                >
                  {item.why}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {done && (
        <div className="fade-up mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4">
          <p aria-live="polite" className="text-sm text-muted">
            <strong className={correct === questions.length ? 'text-emerald' : 'text-ink'}>
              {correct} de {questions.length}
            </strong>{' '}
            {correct === questions.length
              ? '— entendido. Pode seguir.'
              : '— as explicações acima cobrem o que faltou.'}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={() => {
                setPicked({})
                onRetry()
              }}
              className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent/50 hover:text-ink"
            >
              Tentar de novo
            </button>
          )}
        </div>
      )}
    </section>
  )
}
