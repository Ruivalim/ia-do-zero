import type { Paper } from '../lib/curriculum'

/**
 * Header block of a `papers` page: what the original paper is, plus onde ler.
 * Nada de PDF hospedado aqui — os links apontam para a fonte, e quem baixa é o
 * navegador do leitor, direto do publisher.
 */
export default function PaperCard({ paper }: { paper: Paper }) {
  const link = paper.pdfUrl ?? paper.url

  return (
    <section className="not-prose mt-6 rounded-2xl border border-teal/35 bg-teal/[0.05] p-4 sm:p-5">
      <div className="mb-1 text-[11px] font-semibold tracking-wide text-teal uppercase">
        Paper original
      </div>
      <p className="text-base leading-snug font-medium text-ink">{paper.title}</p>
      <p className="mt-1 text-sm text-muted">
        {paper.authors} · {paper.year}
        {paper.venue ? ` · ${paper.venue}` : ''}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {paper.pdfUrl && (
          <a
            href={paper.pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-teal/50 bg-teal/10 px-3 py-2 text-sm font-medium text-teal transition-colors hover:bg-teal/20"
          >
            Abrir o PDF
          </a>
        )}
        {paper.url && (
          <a
            href={paper.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-line px-3 py-2 text-sm text-muted transition-colors hover:border-teal/50 hover:text-ink"
          >
            Página do paper
          </a>
        )}
      </div>

      {link ? (
        <p className="mt-2.5 text-xs text-faint">
          Abre na fonte oficial. Para guardar, use o botão de download do próprio visualizador.
        </p>
      ) : (
        <p className="mt-2.5 text-xs text-faint">Sem link registrado para este paper.</p>
      )}
    </section>
  )
}
