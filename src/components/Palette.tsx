import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { CONCEPTS, TRACK_BY_ID } from '../lib/curriculum'
import { GLOSSARY, GLOSSARY_KEYS } from '../lib/glossary'

const cx = (...p: (string | false | null | undefined)[]) => p.filter(Boolean).join(' ')

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

type Hit = { to: string; title: string; sub: string; kind: 'conceito' | 'termo'; hex?: string }

const INDEX: Hit[] = [
  ...CONCEPTS.map((c) => ({
    to: `/c/${c.slug}`,
    title: c.title,
    sub: c.tagline,
    kind: 'conceito' as const,
    hex: TRACK_BY_ID[c.track].hex,
  })),
  ...GLOSSARY_KEYS.map((k) => ({
    to: GLOSSARY[k].see ? `/c/${GLOSSARY[k].see}` : '/glossario',
    title: GLOSSARY[k].term,
    sub: GLOSSARY[k].short,
    kind: 'termo' as const,
  })),
]

const HAYSTACK = INDEX.map((h) => norm(`${h.title} ${h.sub}`))

export default function Palette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [cursor, setCursor] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  /** quem abriu a paleta — o foco volta pra lá no Esc, senão o Tab recomeça do topo */
  const opener = useRef<HTMLElement | null>(null)

  const results = useMemo(() => {
    const needle = norm(q.trim())
    if (!needle) return INDEX.filter((h) => h.kind === 'conceito').slice(0, 8)
    const words = needle.split(/\s+/)
    return INDEX.map((hit, i) => {
      const hay = HAYSTACK[i]
      if (!words.every((w) => hay.includes(w))) return null
      // title matches rank above tagline matches
      const score = norm(hit.title).includes(needle) ? 0 : 1
      return { hit, score }
    })
      .filter((x): x is { hit: Hit; score: number } => x !== null)
      .sort((a, b) => a.score - b.score)
      .slice(0, 10)
      .map((x) => x.hit)
  }, [q])

  useEffect(() => setCursor(0), [q])

  useEffect(() => {
    if (open) {
      setQ('')
      opener.current = document.activeElement as HTMLElement | null
      const t = setTimeout(() => inputRef.current?.focus(), 10)
      return () => clearTimeout(t)
    }
  }, [open])

  if (!open) return null

  /** navegar move o foco pro <main>, então só devolvemos ao gatilho quando cancela */
  const close = (restoreFocus: boolean) => {
    if (restoreFocus) opener.current?.focus()
    onClose()
  }

  const go = (hit: Hit) => {
    navigate(hit.to)
    close(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => close(true)}
      role="presentation"
    >
      <div
        className="fade-up w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Buscar no curso"
      >
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-results"
          aria-activedescendant={results[cursor] ? `palette-hit-${cursor}` : undefined}
          onKeyDown={(e) => {
            if (e.key === 'Escape') close(true)
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setCursor((c) => Math.min(results.length - 1, c + 1))
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault()
              setCursor((c) => Math.max(0, c - 1))
            }
            if (e.key === 'Enter' && results[cursor]) go(results[cursor])
          }}
          placeholder="Buscar conceito ou termo…"
          className="w-full border-b border-line bg-transparent px-4 py-3.5 text-ink outline-none placeholder:text-faint"
        />
        <ul
          id="palette-results"
          role="listbox"
          aria-label="Resultados"
          className="scroll-thin max-h-[52vh] overflow-y-auto p-2"
        >
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-faint">Nada encontrado.</li>
          )}
          {results.map((hit, i) => (
            <li key={`${hit.kind}-${hit.title}`} role="presentation">
              <button
                type="button"
                id={`palette-hit-${i}`}
                role="option"
                aria-selected={i === cursor}
                tabIndex={-1}
                onMouseEnter={() => setCursor(i)}
                onClick={() => go(hit)}
                className={cx(
                  'flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left',
                  i === cursor ? 'bg-surface-2' : 'hover:bg-surface-2/60',
                )}
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: hit.hex ?? 'var(--c-faint)' }}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm text-ink">{hit.title}</span>
                  <span className="block truncate text-xs text-faint">{hit.sub}</span>
                </span>
                <span className="ml-auto shrink-0 text-[10px] tracking-wide text-faint uppercase">
                  {hit.kind}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
