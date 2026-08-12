import { Link } from 'react-router'
import { usePageMeta } from '../lib/meta'

export default function NotFound() {
  usePageMeta({ title: 'Página não encontrada' })

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-start px-4 py-20 sm:px-8">
      <span className="font-mono text-5xl text-faint">404</span>
      <h1 className="mt-4 text-2xl font-bold text-ink">Essa página não existe</h1>
      <p className="mt-2 text-muted">
        Talvez o capítulo tenha mudado de nome. Use a busca (⌘K) ou volte pro mapa.
      </p>
      <div className="mt-6 flex gap-3">
        <Link to="/" className="rounded-xl bg-accent px-4 py-2.5 font-medium text-bg">
          Início
        </Link>
        <Link to="/mapa" className="rounded-xl border border-line px-4 py-2.5 text-muted">
          Mapa do curso
        </Link>
      </div>
    </div>
  )
}
