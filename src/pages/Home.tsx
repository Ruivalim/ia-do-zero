import { Link } from 'react-router'
import {
  COURSE_CONCEPTS,
  COURSE_TRACKS,
  PAPERS,
  PAPER_TRACKS,
  TOTAL_MINUTES,
  conceptsOf,
} from '../lib/curriculum'
import { useApp } from '../lib/store'
import { usePageMeta } from '../lib/meta'

const demoCount = COURSE_CONCEPTS.filter((c) => c.demo).length

export default function Home() {
  const { done, resetProgress } = useApp()
  usePageMeta({})
  const finished = COURSE_CONCEPTS.filter((c) => done[c.slug]).length
  const firstUndone = COURSE_CONCEPTS.find((c) => !done[c.slug]) ?? COURSE_CONCEPTS[0]
  const papersTrack = PAPER_TRACKS[0]

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8 sm:py-16">
      {/* ── hero ────────────────────────────────────────────────────────── */}
      <section className="mb-14">
        <p className="mb-4 text-[11px] font-semibold tracking-[0.14em] text-accent uppercase">
          curso interativo · português · roda no navegador
        </p>
        <h1 className="max-w-3xl text-4xl leading-[1.1] font-bold tracking-tight text-ink sm:text-5xl">
          Inteligência artificial explicada com coisas que você{' '}
          <span className="text-accent">mexe com a mão</span>.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          Do que é um dado até como um LLM escolhe a próxima palavra. Cada conceito tem uma
          explicação curta, uma analogia, um demo que roda de verdade e uma camada técnica que você
          abre só se quiser.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to={`/c/${firstUndone.slug}`}
            className="rounded-xl bg-accent px-5 py-3 font-medium text-bg transition-opacity hover:opacity-90"
          >
            {finished === 0 ? 'Começar do início' : `Continuar em "${firstUndone.title}"`}
          </Link>
          <Link
            to="/mapa"
            className="rounded-xl border border-line px-5 py-3 text-muted transition-colors hover:text-ink"
          >
            Ver o mapa completo
          </Link>
          {finished > 0 && (
            <button
              type="button"
              onClick={resetProgress}
              className="text-sm text-faint underline underline-offset-4 hover:text-rose"
            >
              zerar progresso
            </button>
          )}
        </div>

        <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-7 sm:grid-cols-4">
          {[
            ['conceitos', String(COURSE_CONCEPTS.length)],
            ['demos interativos', String(demoCount)],
            ['trilhas', String(COURSE_TRACKS.length)],
            ['minutos de leitura', `≈ ${TOTAL_MINUTES}`],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] tracking-wide text-faint uppercase">{label}</dt>
              <dd className="font-mono text-2xl text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── ressalva ────────────────────────────────────────────────────── */}
      <section className="mb-14 rounded-2xl border border-amber/35 bg-amber/[0.06] p-5">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold tracking-wide text-amber uppercase">
          <span aria-hidden="true">⚠️</span>
          Antes de começar
        </div>
        <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted">
          <p>
            O conteúdo deste site foi escrito com auxílio de inteligência artificial e{' '}
            <strong className="text-ink">ainda não passou por revisão completa</strong>. Pode conter
            erro técnico, número impreciso, simplificação que distorce o conceito ou explicação
            desatualizada — a área muda rápido.
          </p>
          <p>
            Trate como ponto de partida para entender a ideia, não como fonte para citar. Antes de
            usar qualquer número, fórmula ou afirmação em prova, artigo ou produção, confira no
            material original. As páginas de papers linkam a fonte justamente para isso.
          </p>
          <p>
            Achou um erro?{' '}
            <a
              href="https://github.com/Ruivalim/ia-do-zero/issues/new"
              target="_blank"
              rel="noreferrer"
              className="text-amber underline underline-offset-3 hover:text-ink"
            >
              Abra uma issue
            </a>{' '}
            — correção vale mais que elogio.
          </p>
        </div>
      </section>

      {/* ── tracks ──────────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-6 text-xl font-semibold tracking-tight text-ink">
          As {COURSE_TRACKS.length === 6 ? 'seis' : COURSE_TRACKS.length} trilhas
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {COURSE_TRACKS.map((t) => {
            const items = conceptsOf(t.id)
            const d = items.filter((c) => done[c.slug]).length
            return (
              <Link
                key={t.id}
                to={`/t/${t.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-[color-mix(in_oklab,var(--tc)_50%,transparent)]"
                style={{ ['--tc' as string]: t.hex }}
              >
                <span
                  className="absolute inset-x-0 top-0 h-[3px]"
                  style={{ background: t.hex, opacity: 0.85 }}
                  aria-hidden="true"
                />
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono text-2xl" style={{ color: t.hex }}>
                    {t.n}
                  </span>
                  <h3 className="text-base font-semibold text-ink">{t.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">{t.tagline}</p>
                <div className="mt-4 flex items-center gap-3 text-xs text-faint">
                  <span>{items.length} conceitos</span>
                  <span>·</span>
                  <span>{items.filter((c) => c.demo).length} demos</span>
                  {d > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-emerald">
                        {d}/{items.length} feitos
                      </span>
                    </>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── papers ──────────────────────────────────────────────────────── */}
      {papersTrack && PAPERS.length > 0 && (
        <section className="mt-14">
          <div className="mb-2 flex flex-wrap items-baseline gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-ink">{papersTrack.title}</h2>
            <Link to={`/t/${papersTrack.slug}`} className="text-sm text-faint hover:text-teal">
              ver todos ({PAPERS.length}) →
            </Link>
          </div>
          <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted">{papersTrack.tagline}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {PAPERS.slice(0, 4).map((c) => (
              <Link
                key={c.slug}
                to={`/c/${c.slug}`}
                className="rounded-xl border border-line bg-surface p-4 transition-colors hover:border-teal/50"
              >
                <div className="text-sm font-medium text-ink">{c.title}</div>
                <div className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                  {c.tagline}
                </div>
                {c.paper && (
                  <div className="mt-2.5 text-[11px] text-faint">
                    {c.paper.authors} · {c.paper.year}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── how to use ──────────────────────────────────────────────────── */}
      <section className="mt-14 rounded-2xl border border-line bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-ink">Como usar</h2>
        <ul className="flex flex-col gap-3 text-sm leading-relaxed text-muted">
          <li>
            <strong className="text-ink">Simples / Técnico</strong> lá em cima controla os blocos
            roxos "por baixo do capô". No modo simples eles ficam fechados e a leitura é para
            qualquer pessoa; no técnico abrem com fórmulas e detalhe de implementação.
          </li>
          <li>
            <strong className="text-ink">Os demos são de verdade.</strong> Nenhum chama API. Tudo é
            calculado no seu navegador, então dá pra mexer sem medo e sem custo.
          </li>
          <li>
            <strong className="text-ink">Não precisa seguir a ordem.</strong> Cada página lista os
            pré-requisitos no topo. Se travar, é só clicar.
          </li>
          <li>
            <strong className="text-ink">⌘K</strong> (ou <strong className="text-ink">/</strong>)
            abre a busca de conceitos e termos.
          </li>
        </ul>
      </section>
    </div>
  )
}
