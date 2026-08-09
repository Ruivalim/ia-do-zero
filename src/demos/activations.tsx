import { useMemo, useState } from 'react'
import {
  Caption,
  Choice,
  Controls,
  Grid,
  Legend,
  Plot,
  Row,
  SERIES,
  Slider,
  Stat,
  Stats,
  Toggle,
  VIZ,
} from '../components/ui'
import { fmt } from '../lib/mathx'

/* As seis ativações que importam na prática, com suas derivadas analíticas.
   A faixa rosa é a "zona morta" (|f'| < 0,05): empilhe N camadas e o
   gradiente morre ali — foi por isso que a sigmoid perdeu para a ReLU. */

const W = 520
const H = 320
const PADX = 30
const PADY = 18
const X0 = -6
const X1 = 6
const Y0 = -2
const Y1 = 6.5
const DEAD = 0.05

const toPx = (x: number) => PADX + ((x - X0) / (X1 - X0)) * (W - 2 * PADX)
const toPy = (y: number) => H - PADY - ((y - Y0) / (Y1 - Y0)) * (H - 2 * PADY)

const phi = (x: number) => Math.exp(-(x * x) / 2) / Math.sqrt(2 * Math.PI)
/** Abramowitz–Stegun 7.1.26, erro < 1.5e-7 — sobra para um gráfico */
const erf = (z: number) => {
  const t = 1 / (1 + 0.5 * Math.abs(z))
  const q =
    1.00002368 +
    t *
      (0.37409196 +
        t *
          (0.09678418 +
            t *
              (-0.18628806 +
                t *
                  (0.27886807 +
                    t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))
  const p = 1 - t * Math.exp(-z * z - 1.26551223 + t * q)
  return z >= 0 ? p : -p
}
const Phi = (x: number) => 0.5 * (1 + erf(x / Math.SQRT2))
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))

const ACTS = {
  sigmoid: { label: 'sigmoid', f: sigmoid, d: (x: number) => sigmoid(x) * (1 - sigmoid(x)) },
  tanh: { label: 'tanh', f: Math.tanh, d: (x: number) => 1 - Math.tanh(x) ** 2 },
  relu: { label: 'ReLU', f: (x: number) => Math.max(0, x), d: (x: number) => (x > 0 ? 1 : 0) },
  leaky: {
    label: 'Leaky ReLU',
    f: (x: number) => (x > 0 ? x : 0.01 * x),
    d: (x: number) => (x > 0 ? 1 : 0.01),
  },
  gelu: { label: 'GELU', f: (x: number) => x * Phi(x), d: (x: number) => Phi(x) + x * phi(x) },
  silu: {
    label: 'SiLU',
    f: (x: number) => x * sigmoid(x),
    d: (x: number) => sigmoid(x) * (1 + x * (1 - sigmoid(x))),
  },
}

type ActId = keyof typeof ACTS
const IDS = Object.keys(ACTS) as ActId[]

function pathOf(fn: (x: number) => number) {
  let d = ''
  for (let i = 0; i <= 240; i++) {
    const x = X0 + (i / 240) * (X1 - X0)
    d += `${i === 0 ? 'M' : 'L'}${fmt(toPx(x), 1)},${fmt(toPy(fn(x)), 1)}`
  }
  return d
}

export default function ActivationsDemo() {
  const [id, setId] = useState<ActId>('sigmoid')
  const [overlay, setOverlay] = useState(false)
  const [x, setX] = useState(3)
  const [depth, setDepth] = useState(8)
  const act = ACTS[id]

  const mainPath = useMemo(() => pathOf(act.f), [act])
  const derivPath = useMemo(() => pathOf(act.d), [act])
  const allPaths = useMemo(() => IDS.map((k) => pathOf(ACTS[k].f)), [])

  const deadZones = useMemo(() => {
    const zones: [number, number][] = []
    let start: number | null = null
    for (let i = 0; i <= 400; i++) {
      const z = X0 + (i / 400) * (X1 - X0)
      const dead = Math.abs(act.d(z)) < DEAD
      if (dead && start === null) start = z
      if (!dead && start !== null) {
        zones.push([start, z])
        start = null
      }
    }
    if (start !== null) zones.push([start, X1])
    return zones
  }, [act])

  const deadPct = (deadZones.reduce((s, [a, b]) => s + b - a, 0) / (X1 - X0)) * 100
  const fx = act.f(x)
  const dfx = act.d(x)
  const grad = Math.abs(dfx) ** depth

  return (
    <div className="flex flex-col gap-4">
      <Row>
        <Choice
          value={id}
          onChange={setId}
          options={IDS.map((k) => ({ value: k, label: ACTS[k].label }))}
        />
        <span className="ml-auto" />
        <Toggle label="sobrepor todas" checked={overlay} onChange={setOverlay} />
      </Row>

      <Plot w={W} h={H} aria-label="Função de ativação e sua derivada, com a zona morta em rosa">
        <Grid w={W} h={H} step={52} />
        <defs>
          <clipPath id="act-clip">
            <rect x={PADX} y={PADY} width={W - 2 * PADX} height={H - 2 * PADY} />
          </clipPath>
        </defs>

        {deadZones.map(([a, b], i) => (
          <rect
            key={i}
            x={toPx(a)}
            y={PADY}
            width={toPx(b) - toPx(a)}
            height={H - 2 * PADY}
            fill={VIZ.e}
            opacity={0.09}
          />
        ))}

        <line x1={PADX} y1={toPy(0)} x2={W - PADX} y2={toPy(0)} stroke={VIZ.axis} strokeWidth={1} />
        <line x1={toPx(0)} y1={PADY} x2={toPx(0)} y2={H - PADY} stroke={VIZ.axis} strokeWidth={1} />
        <text x={W - PADX + 6} y={toPy(0) + 4} fill={VIZ.axis} fontSize={11}>
          x
        </text>

        <g clipPath="url(#act-clip)">
          {overlay &&
            allPaths.map((p, i) => (
              <path
                key={IDS[i]}
                d={p}
                fill="none"
                stroke={SERIES[i]}
                strokeWidth={IDS[i] === id ? 2.5 : 1.5}
                opacity={IDS[i] === id ? 1 : 0.55}
                strokeLinejoin="round"
              />
            ))}
          {!overlay && (
            <>
              <path
                d={derivPath}
                fill="none"
                stroke={VIZ.b}
                strokeWidth={2}
                strokeDasharray="5 4"
              />
              <path
                d={mainPath}
                fill="none"
                stroke={VIZ.a}
                strokeWidth={2.5}
                strokeLinejoin="round"
              />
            </>
          )}

          <line
            x1={toPx(x)}
            y1={PADY}
            x2={toPx(x)}
            y2={H - PADY}
            stroke={VIZ.muted}
            strokeWidth={1}
            strokeDasharray="3 4"
            opacity={0.5}
          />
          {!overlay && (
            <circle cx={toPx(x)} cy={toPy(dfx)} r={4} fill="none" stroke={VIZ.b} strokeWidth={2} />
          )}
          <circle
            cx={toPx(x)}
            cy={toPy(fx)}
            r={5.5}
            fill={VIZ.a}
            stroke={VIZ.ink}
            strokeWidth={1.5}
          />
        </g>
      </Plot>

      <Controls>
        <Slider
          label="entrada x"
          value={x}
          onChange={setX}
          min={-6}
          max={6}
          step={0.1}
          format={(v) => v.toFixed(1)}
          hint="O marcador desliza na curva. Entre na faixa rosa e veja a derivada sumir."
        />
        <Slider
          label="profundidade da rede"
          value={depth}
          onChange={setDepth}
          min={1}
          max={20}
          hint="Gradiente ≈ derivada aqui elevada a N camadas."
        />
      </Controls>

      <Stats>
        <Stat label="f(x)" value={fmt(fx, 3)} tone="accent" />
        <Stat label="f′(x)" value={fmt(dfx, 4)} tone={Math.abs(dfx) < DEAD ? 'rose' : 'violet'} />
        <Stat label="zona morta do eixo" value={`${Math.round(deadPct)}%`} tone="rose" />
        <Stat
          label={`gradiente após ${depth} camadas`}
          value={grad.toExponential(2)}
          tone={grad < 1e-3 ? 'rose' : 'emerald'}
        />
      </Stats>

      <Legend
        items={
          overlay
            ? IDS.map((k, i) => ({ color: SERIES[i], label: ACTS[k].label }))
            : [
                { color: VIZ.a, label: `f(x) · ${act.label}` },
                { color: VIZ.b, label: 'f′(x)', dashed: true },
              ]
        }
      />

      <Caption>
        A faixa rosa é a zona morta: ali |f′(x)| &lt; 0,05 e o gradiente praticamente some. Sigmoid
        e tanh saturam nos dois rabos — deslize x para ±5 e suba a profundidade: depois de 10
        camadas não sobra nada para as primeiras camadas aprenderem. ReLU morre só do lado negativo
        (e Leaky ReLU nem isso), então o gradiente atravessa 20 camadas intacto. GELU e SiLU são
        versões suaves da ReLU usadas nos transformers. Foi por isso que ReLU e suas variantes
        venceram na prática.
      </Caption>
    </div>
  )
}
