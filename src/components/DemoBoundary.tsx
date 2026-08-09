import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * A demo that throws should degrade to a message, not blank the whole page.
 * Class component because React still has no hook equivalent for this.
 */
export default class DemoBoundary extends Component<
  { children: ReactNode; id: string },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[demo:${this.props.id}]`, error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div className="rounded-xl border border-rose/40 bg-rose/[0.06] p-4 text-sm">
        <p className="font-medium text-rose">Esse demo quebrou.</p>
        <p className="mt-1 text-muted">
          O resto da página continua funcionando. Recarregue para tentar de novo.
        </p>
        <button
          type="button"
          onClick={() => this.setState({ error: null })}
          className="mt-3 rounded-lg border border-line px-3 py-1.5 text-muted hover:text-ink"
        >
          Tentar de novo
        </button>
      </div>
    )
  }
}
