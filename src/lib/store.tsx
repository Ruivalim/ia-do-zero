import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

// ── persistence ─────────────────────────────────────────────────────────────

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* private mode, quota — not worth breaking the page over */
  }
}

export function usePersistent<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => read(key, initial))
  useEffect(() => write(key, value), [key, value])
  return [value, setValue] as const
}

// ── app state ───────────────────────────────────────────────────────────────

export type Depth = 'simples' | 'tecnico'

type AppState = {
  theme: 'dark' | 'light'
  toggleTheme: () => void

  /** global "Simples / Técnico" switch — collapses or expands every <Deep> block */
  depth: Depth
  setDepth: (d: Depth) => void

  done: Record<string, true>
  isDone: (slug: string) => boolean
  toggleDone: (slug: string) => void
  resetProgress: () => void
}

const Ctx = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = usePersistent<'dark' | 'light'>('izero.theme', 'dark')
  const [depth, setDepth] = usePersistent<Depth>('izero.depth', 'simples')
  const [done, setDone] = usePersistent<Record<string, true>>('izero.done', {})

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleTheme = useCallback(
    () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    [setTheme],
  )

  const toggleDone = useCallback(
    (slug: string) =>
      setDone((d) => {
        const next = { ...d }
        if (next[slug]) delete next[slug]
        else next[slug] = true
        return next
      }),
    [setDone],
  )

  const value = useMemo<AppState>(
    () => ({
      theme,
      toggleTheme,
      depth,
      setDepth,
      done,
      isDone: (s) => Boolean(done[s]),
      toggleDone,
      resetProgress: () => setDone({}),
    }),
    [theme, toggleTheme, depth, setDepth, done, toggleDone, setDone],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp fora do AppProvider')
  return v
}
