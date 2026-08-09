import { useMemo, useState } from 'react'
import {
  Btn,
  Caption,
  Controls,
  Legend,
  Plot,
  Row,
  Slider,
  Stat,
  Stats,
  Toggle,
  VIZ,
} from '../components/ui'
import { fmt, gaussian, mse, polyfit, polyval, rng } from '../lib/mathx'

const W = 520
const H = 250
const PAD = 30
type Point = { x: number; y: number; train: boolean }

function dataFor(seed: number): Point[] {
  const next = rng(11 + seed)
  return Array.from({ length: 14 }, (_, i) => {
    const x = -1 + (2 * i) / 13
    return {
      x,
      y: 0.65 * Math.sin(3.2 * x) + gaussian(next, 0, 0.12),
      train: ![1, 4, 7, 10, 12].includes(i),
    }
  })
}

const sx = (x: number) => PAD + ((x + 1) / 2) * (W - 2 * PAD)
const sy = (y: number) => H - PAD - ((y + 1.15) / 2.3) * (H - 2 * PAD)

export default function PolyfitDemo() {
  const [degree, setDegree] = useState(3)
  const [seed, setSeed] = useState(0)
  const [showValidation, setShowValidation] = useState(true)
  const data = useMemo(() => dataFor(seed), [seed])
  const train = data.filter((p) => p.train)
  const validation = data.filter((p) => !p.train)
  const fits = useMemo(
    () =>
      Array.from({ length: 12 }, (_, d) =>
        polyfit(
          train.map((p) => p.x),
          train.map((p) => p.y),
          d + 1,
          1e-7,
        ),
      ),
    [train],
  )
  const errors = useMemo(
    () =>
      fits.map((fit) => ({
        train: mse(
          train.map((p) => polyval(fit, p.x)),
          train.map((p) => p.y),
        ),
        validation: mse(
          validation.map((p) => polyval(fit, p.x)),
          validation.map((p) => p.y),
        ),
      })),
    [fits, train, validation],
  )
  const fit = fits[degree - 1]
  const curve = Array.from({ length: 121 }, (_, i) => {
    const x = -1 + (2 * i) / 120
    return `${sx(x)},${sy(polyval(fit, x))}`
  }).join(' ')
  const cap = Math.max(0.35, ...errors.flatMap((e) => [e.train, Math.min(e.validation, 4)]))
  const ex = (d: number) => PAD + ((d - 1) / 11) * (W - 2 * PAD)
  const ey = (v: number) => H - PAD - (Math.min(v, cap) / cap) * (H - 2 * PAD)
  const line = (key: 'train' | 'validation') =>
    errors.map((e, i) => `${ex(i + 1)},${ey(e[key])}`).join(' ')
  const best = errors.reduce((bi, e, i) => (e.validation < errors[bi].validation ? i : bi), 0) + 1

  return (
    <div className="flex flex-col gap-4">
      <Row>
        <Btn onClick={() => setSeed((s) => s + 1)}>Novo dataset</Btn>
        <Toggle label="mostrar validação" checked={showValidation} onChange={setShowValidation} />
      </Row>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Plot w={W} h={H} aria-label="Curva polinomial ajustada aos pontos">
          <rect x={PAD} y={PAD} width={W - 2 * PAD} height={H - 2 * PAD} fill={VIZ.surface} />
          <polyline points={curve} fill="none" stroke={VIZ.a} strokeWidth={2.5} />
          {data
            .filter((p) => p.train || showValidation)
            .map((p, i) => (
              <circle
                key={i}
                cx={sx(p.x)}
                cy={sy(p.y)}
                r={5}
                fill={p.train ? VIZ.b : VIZ.surface}
                stroke={VIZ.b}
                strokeWidth={2}
              />
            ))}
        </Plot>
        <Plot w={W} h={H} aria-label="Erro de treino e validação para cada grau">
          <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke={VIZ.axis} />
          <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke={VIZ.axis} />
          <polyline points={line('train')} fill="none" stroke={VIZ.a} strokeWidth={2.5} />
          {showValidation && (
            <polyline points={line('validation')} fill="none" stroke={VIZ.e} strokeWidth={2.5} />
          )}
          <circle cx={ex(degree)} cy={ey(errors[degree - 1].train)} r={5} fill={VIZ.a} />
          {showValidation && (
            <circle cx={ex(degree)} cy={ey(errors[degree - 1].validation)} r={5} fill={VIZ.e} />
          )}
          {[1, 3, 5, 7, 9, 11].map((d) => (
            <text key={d} x={ex(d)} y={H - 10} fill={VIZ.axis} fontSize={10} textAnchor="middle">
              {d}
            </text>
          ))}
        </Plot>
      </div>
      <Legend
        items={[
          { color: VIZ.a, label: 'treino' },
          { color: VIZ.e, label: 'validação' },
        ]}
      />
      <Controls cols={1}>
        <Slider label="grau do polinômio" value={degree} onChange={setDegree} min={1} max={12} />
      </Controls>
      <Stats>
        <Stat label="MSE treino" value={fmt(errors[degree - 1].train, 4)} tone="accent" />
        <Stat label="MSE validação" value={fmt(errors[degree - 1].validation, 4)} tone="rose" />
        <Stat label="grau" value={degree} />
        <Stat label="melhor grau" value={best} tone="emerald" />
      </Stats>
      <Caption>
        Grau baixo não acompanha a forma dos dados: underfitting. Grau alto passa por quase todo
        ponto de treino, mas oscila entre eles e piora na validação: overfitting.
      </Caption>
    </div>
  )
}
