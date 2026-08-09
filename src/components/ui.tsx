import type { ReactNode } from 'react'

/* ────────────────────────────────────────────────────────────────────────────
   Shared control + readout kit. Every demo is built out of these so the whole
   site feels like one instrument panel instead of 36 different ones.
   Series colors come from `VIZ`, which is theme-aware via CSS variables.
   ──────────────────────────────────────────────────────────────────────────── */

export const VIZ = {
  a: 'var(--c-accent)',
  b: 'var(--c-violet)',
  c: 'var(--c-amber)',
  d: 'var(--c-emerald)',
  e: 'var(--c-rose)',
  f: 'var(--c-blue)',
  grid: 'var(--c-grid)',
  axis: 'var(--c-faint)',
  ink: 'var(--c-text)',
  muted: 'var(--c-muted)',
  surface: 'var(--c-surface)',
  border: 'var(--c-border)',
} as const

/** categorical series colors, in the order a chart should consume them */
export const SERIES = [VIZ.a, VIZ.b, VIZ.c, VIZ.d, VIZ.e, VIZ.f]

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ')

// ── layout ──────────────────────────────────────────────────────────────────

export function Controls({ children, cols = 2 }: { children: ReactNode; cols?: 1 | 2 | 3 }) {
  const grid = cols === 1 ? 'sm:grid-cols-1' : cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
  return <div className={cx('grid grid-cols-1 gap-x-5 gap-y-3', grid)}>{children}</div>
}

export function Row({ children, wrap = true }: { children: ReactNode; wrap?: boolean }) {
  return <div className={cx('flex items-center gap-2', wrap && 'flex-wrap')}>{children}</div>
}

export function Panel({
  children,
  title,
  className,
}: {
  children: ReactNode
  title?: string
  className?: string
}) {
  return (
    <div className={cx('rounded-xl border border-line bg-surface-2/60 p-3', className)}>
      {title && (
        <div className="mb-2 text-[11px] font-semibold tracking-wide text-faint uppercase">
          {title}
        </div>
      )}
      {children}
    </div>
  )
}

// ── inputs ──────────────────────────────────────────────────────────────────

export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format,
  hint,
  disabled,
}: {
  label: ReactNode
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  format?: (v: number) => string
  hint?: string
  disabled?: boolean
}) {
  return (
    <label className={cx('block select-none', disabled && 'opacity-50')}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-muted">{label}</span>
        <span className="font-mono text-sm tabular-nums text-ink">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <div className="-mt-1 text-xs text-faint">{hint}</div>}
    </label>
  )
}

export function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label?: ReactNode
  value: T
  options: readonly { value: T; label: string; title?: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="select-none">
      {label && <div className="mb-1.5 text-sm text-muted">{label}</div>}
      <div className="inline-flex flex-wrap gap-1 rounded-lg border border-line bg-surface-2 p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            title={o.title}
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={cx(
              'rounded-md px-2.5 py-1 text-sm transition-colors',
              value === o.value
                ? 'bg-accent font-medium text-bg'
                : 'text-muted hover:bg-surface hover:text-ink',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: ReactNode
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex select-none items-center gap-2.5 text-sm text-muted transition-colors hover:text-ink"
    >
      <span
        className={cx(
          'relative h-5 w-9 shrink-0 rounded-full border transition-colors',
          checked ? 'border-accent bg-accent' : 'border-line bg-surface-2',
        )}
      >
        <span
          className={cx(
            'absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all',
            checked ? 'left-[18px] bg-bg' : 'left-0.5 bg-faint',
          )}
        />
      </span>
      {label}
    </button>
  )
}

export function Btn({
  children,
  onClick,
  variant = 'ghost',
  disabled,
  title,
}: {
  children: ReactNode
  onClick: () => void
  variant?: 'primary' | 'ghost' | 'danger'
  disabled?: boolean
  title?: string
}) {
  const styles = {
    primary: 'bg-accent text-bg hover:opacity-90 border-transparent font-medium',
    ghost: 'bg-surface-2 text-ink hover:bg-surface border-line',
    danger: 'bg-transparent text-rose hover:bg-rose/10 border-line',
  }[variant]
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'rounded-lg border px-3 py-1.5 text-sm transition-all active:scale-[0.97]',
        'disabled:pointer-events-none disabled:opacity-40',
        styles,
      )}
    >
      {children}
    </button>
  )
}

// ── readouts ────────────────────────────────────────────────────────────────

export function Stat({
  label,
  value,
  unit,
  tone = 'ink',
  hint,
}: {
  label: string
  value: ReactNode
  unit?: string
  tone?: 'ink' | 'accent' | 'emerald' | 'amber' | 'rose' | 'violet'
  hint?: string
}) {
  const toneClass = {
    ink: 'text-ink',
    accent: 'text-accent',
    emerald: 'text-emerald',
    amber: 'text-amber',
    rose: 'text-rose',
    violet: 'text-violet',
  }[tone]
  return (
    <div title={hint} className="min-w-0">
      <div className="truncate text-[11px] tracking-wide text-faint uppercase">{label}</div>
      <div className={cx('font-mono text-lg leading-tight tabular-nums', toneClass)}>
        {value}
        {unit && <span className="ml-0.5 text-xs text-faint">{unit}</span>}
      </div>
    </div>
  )
}

export function Stats({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">{children}</div>
}

export function Legend({ items }: { items: { color: string; label: string; dashed?: boolean }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          <svg width="14" height="10" aria-hidden="true">
            <line
              x1="0"
              y1="5"
              x2="14"
              y2="5"
              stroke={it.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={it.dashed ? '3 3' : undefined}
            />
          </svg>
          {it.label}
        </span>
      ))}
    </div>
  )
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'accent' | 'emerald' | 'amber' | 'rose' | 'violet'
}) {
  const tones = {
    neutral: 'border-line text-muted',
    accent: 'border-accent/40 text-accent',
    emerald: 'border-emerald/40 text-emerald',
    amber: 'border-amber/40 text-amber',
    rose: 'border-rose/40 text-rose',
    violet: 'border-violet/40 text-violet',
  }[tone]
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[11px]',
        tones,
      )}
    >
      {children}
    </span>
  )
}

/** Horizontal bar for probability-style readouts. `value` in 0..1. */
export function Bar({
  value,
  color = VIZ.a,
  label,
  right,
  highlight,
}: {
  value: number
  color?: string
  label?: ReactNode
  right?: ReactNode
  highlight?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      {label !== undefined && (
        <div className="w-20 shrink-0 truncate font-mono text-xs text-muted sm:w-28">{label}</div>
      )}
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full transition-[width] duration-200"
          style={{
            width: `${Math.max(0, Math.min(1, value)) * 100}%`,
            background: color,
            opacity: highlight === false ? 0.32 : 1,
          }}
        />
      </div>
      {right !== undefined && (
        <div className="w-12 shrink-0 text-right font-mono text-xs tabular-nums text-faint">
          {right}
        </div>
      )}
    </div>
  )
}

/** A short caption under a chart. Explains what the reader should notice. */
export function Caption({ children }: { children: ReactNode }) {
  return <p className="text-xs leading-relaxed text-faint">{children}</p>
}

/** Responsive SVG wrapper: fixed viewBox, fluid width, no layout jump. */
export function Plot({
  w,
  h,
  children,
  className,
  svgRef,
  ...rest
}: {
  w: number
  h: number
  children: ReactNode
  className?: string
  svgRef?: React.Ref<SVGSVGElement>
} & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${w} ${h}`}
      className={cx('w-full touch-none select-none', className)}
      style={{ aspectRatio: `${w} / ${h}` }}
      role="img"
      {...rest}
    >
      {children}
    </svg>
  )
}

/** Dotted background grid for scatter plots. */
export function Grid({
  w,
  h,
  step = 40,
  stroke = VIZ.grid,
}: {
  w: number
  h: number
  step?: number
  stroke?: string
}) {
  const lines: ReactNode[] = []
  for (let x = step; x < w; x += step)
    lines.push(<line key={`v${x}`} x1={x} y1={0} x2={x} y2={h} stroke={stroke} strokeWidth={1} />)
  for (let y = step; y < h; y += step)
    lines.push(<line key={`h${y}`} x1={0} y1={y} x2={w} y2={y} stroke={stroke} strokeWidth={1} />)
  return <g aria-hidden="true">{lines}</g>
}
