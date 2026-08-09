import { Link } from 'react-router'
import { CONCEPTS, TOTAL_MINUTES, TRACKS, conceptsOf } from '../lib/curriculum'
import { useApp } from '../lib/store'

const demoCount = CONCEPTS.filter((c) => c.demo).length

export default function Home() {
  const { done, resetProgress } = useApp()
  const finished = CONCEPTS.filter((c) => done[c.slug]).length
  const firstUndone = CONCEPTS.find((c) => !done[c.slug]) ?? CONCEPTS[0]

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
            ['conceitos', String(CONCEPTS.length)],
            ['demos interativos', String(demoCount)],
            ['trilhas', String(TRACKS.length)],
            ['minutos de leitura', `≈ ${TOTAL_MINUTES}`],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] tracking-wide text-faint uppercase">{label}</dt>
              <dd className="font-mono text-2xl text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── tracks ──────────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-6 text-xl font-semibold tracking-tight text-ink">As seis trilhas</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {TRACKS.map((t) => {
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
