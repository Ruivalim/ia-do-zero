import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { useApp } from '../lib/store'
import Sidebar from './Sidebar'
import Palette from './Palette'

const cx = (...p: (string | false | null | undefined)[]) => p.filter(Boolean).join(' ')

function DepthSwitch() {
  const { depth, setDepth } = useApp()
  return (
    <div
      className="inline-flex rounded-lg border border-line bg-surface-2 p-0.5"
      role="group"
      aria-label="Nível de detalhe"
    >
      {(['simples', 'tecnico'] as const).map((d) => (
        <button
          key={d}
          type="button"
          aria-pressed={depth === d}
          onClick={() => setDepth(d)}
          title={
            d === 'simples'
              ? 'Esconde os blocos técnicos por padrão'
              : 'Abre os blocos técnicos por padrão'
          }
          className={cx(
            'rounded-md px-2.5 py-1 text-xs transition-colors',
            depth === d ? 'bg-accent font-medium text-bg' : 'text-muted hover:text-ink',
          )}
        >
          {d === 'simples' ? 'Simples' : 'Técnico'}
        </button>
      ))}
    </div>
  )
}

export default function Layout({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useApp()
  const [drawer, setDrawer] = useState(false)
  const [palette, setPalette] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setDrawer(false), [pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette((v) => !v)
      }
      if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test((e.target as HTMLElement)?.tagName ?? '')) {
        e.preventDefault()
        setPalette(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawer])

  return (
    <div className="min-h-dvh">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-bg"
      >
        Pular para o conteúdo
      </a>

      {/* ── top bar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="flex h-14 items-center gap-3 px-3 sm:px-5">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Abrir menu"
            className="rounded-lg border border-line px-2.5 py-1.5 text-muted hover:text-ink lg:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>

          <Link to="/" className="flex items-center gap-2.5">
            <span
              className="grid h-7 w-7 place-items-center rounded-lg border border-accent/40 bg-accent/10 font-mono text-xs text-accent"
              aria-hidden="true"
            >
              IA
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-ink">IA do Zero</span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPalette(true)}
              className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs text-faint transition-colors hover:text-muted"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
                <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <span className="hidden sm:inline">Buscar</span>
              <kbd className="hidden rounded border border-line px-1 font-mono text-[10px] md:inline">
                ⌘K
              </kbd>
            </button>

            <div className="hidden sm:block">
              <DepthSwitch />
            </div>

            <a
              href="https://github.com/Ruivalim/ia-do-zero"
              target="_blank"
              rel="noreferrer"
              aria-label="Código no GitHub"
              title="Código no GitHub"
              className="rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-muted transition-colors hover:text-ink"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
              </svg>
            </a>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
              className="rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-muted transition-colors hover:text-ink"
            >
              {theme === 'dark' ? '☀' : '☾'}
            </button>
          </div>
        </div>
        <div className="border-t border-line px-3 py-2 sm:hidden">
          <DepthSwitch />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px]">
        {/* ── desktop sidebar ───────────────────────────────────────────── */}
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-72 shrink-0 border-r border-line lg:block">
          <Sidebar />
        </aside>

        {/* ── mobile drawer ─────────────────────────────────────────────── */}
        {drawer && (
          <div
            className="fixed inset-0 z-50 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="absolute inset-0 bg-black/55" onClick={() => setDrawer(false)} />
            <div className="fade-up absolute inset-y-0 left-0 flex w-[86vw] max-w-xs flex-col border-r border-line bg-bg">
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
                <span className="text-sm font-semibold text-ink">Trilhas</span>
                <button
                  type="button"
                  onClick={() => setDrawer(false)}
                  aria-label="Fechar menu"
                  className="rounded-lg border border-line px-2 py-1 text-muted"
                >
                  ✕
                </button>
              </div>
              <div className="min-h-0 flex-1">
                <Sidebar onNavigate={() => setDrawer(false)} />
              </div>
            </div>
          </div>
        )}

        <main id="conteudo" className="min-w-0 flex-1">
          {children}
        </main>
      </div>

      <Palette open={palette} onClose={() => setPalette(false)} />
    </div>
  )
}
