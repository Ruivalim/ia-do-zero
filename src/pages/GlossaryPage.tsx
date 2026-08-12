import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { GLOSSARY, GLOSSARY_KEYS } from '../lib/glossary'
import { BY_SLUG } from '../lib/curriculum'
import { usePageMeta } from '../lib/meta'

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

export default function GlossaryPage() {
  const [q, setQ] = useState('')

  usePageMeta({
    title: 'Glossário',
    description:
      'Todo o vocabulário do curso em uma página: cada termo em uma linha, com link para o capítulo que explica direito.',
  })

  const keys = useMemo(() => {
    const needle = norm(q.trim())
    if (!needle) return GLOSSARY_KEYS
    return GLOSSARY_KEYS.filter((k) => {
      const e = GLOSSARY[k]
      return norm(`${e.term} ${e.short} ${e.long ?? ''} ${(e.aka ?? []).join(' ')}`).includes(
        needle,
      )
    })
  }, [q])

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-8 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-ink">Glossário</h1>
      <p className="mt-3 text-muted">
        {GLOSSARY_KEYS.length} termos que aparecem o tempo todo em conversa sobre IA, em uma linha
        cada.
      </p>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filtrar termos…"
        className="mt-6 w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-ink outline-none placeholder:text-faint focus:border-accent/60"
      />

      <dl className="mt-8 flex flex-col divide-y divide-[var(--c-border)]">
        {keys.map((k) => {
          const e = GLOSSARY[k]
          const concept = e.see ? BY_SLUG[e.see] : undefined
          return (
            <div key={k} className="py-4">
              <dt className="flex flex-wrap items-baseline gap-2">
                <span className="font-semibold text-ink">{e.term}</span>
                {e.aka?.map((a) => (
                  <span key={a} className="font-mono text-xs text-faint">
                    {a}
                  </span>
                ))}
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted">
                {e.short}
                {e.long && <span className="mt-1.5 block text-faint">{e.long}</span>}
                {concept && (
                  <Link
                    to={`/c/${concept.slug}`}
                    className="mt-1.5 inline-block text-xs text-accent underline underline-offset-3"
                  >
                    ver o capítulo: {concept.title}
                  </Link>
                )}
              </dd>
            </div>
          )
        })}
        {keys.length === 0 && <p className="py-8 text-sm text-faint">Nenhum termo bate.</p>}
      </dl>
    </div>
  )
}
