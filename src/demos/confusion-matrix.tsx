import { useMemo, useState } from 'react'
import { Caption, Controls, Plot, Slider, Stat, Stats, VIZ } from '../components/ui'
import { clamp, gaussian, rng } from '../lib/mathx'

const W = 520
const H = 260
type Example = { score: number; positive: boolean }

function makeData(separation: number, prevalence: number): Example[] {
  const next = rng(13)
  return Array.from({ length: 200 }, () => {
    const positive = next() < prevalence
    const mean = 0.5 + (positive ? separation : -separation) * 0.26
    return { positive, score: clamp(gaussian(next, mean, 0.18), 0, 1) }
  })
}

export default function ConfusionMatrixDemo() {
  const [threshold, setThreshold] = useState(0.5)
  const [separation, setSeparation] = useState(1)
  const [prevalence, setPrevalence] = useState(0.35)
  const data = useMemo(() => makeData(separation, prevalence), [separation, prevalence])
  const vp = data.filter((d) => d.positive && d.score >= threshold).length
  const fp = data.filter((d) => !d.positive && d.score >= threshold).length
  const fn = data.filter((d) => d.positive && d.score < threshold).length
  const vn = data.length - vp - fp - fn
  const accuracy = (vp + vn) / data.length
  const precision = vp / Math.max(1, vp + fp)
  const recall = vp / Math.max(1, vp + fn)
  const f1 = (2 * precision * recall) / Math.max(1e-9, precision + recall)
  const bins = 20
  const hist = Array.from({ length: bins }, (_, i) => ({
    positive: data.filter((d) => d.positive && Math.min(bins - 1, Math.floor(d.score * bins)) === i)
      .length,
    negative: data.filter(
      (d) => !d.positive && Math.min(bins - 1, Math.floor(d.score * bins)) === i,
    ).length,
  }))
  const maxBin = Math.max(1, ...hist.flatMap((b) => [b.positive, b.negative]))
  const matrix = [
    { n: vn, label: 'VN', color: VIZ.d },
    { n: fp, label: 'FP', color: VIZ.e },
    { n: fn, label: 'FN', color: VIZ.e },
    { n: vp, label: 'VP', color: VIZ.d },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Plot w={W} h={H} aria-label="Histogramas dos scores positivos e negativos">
          {hist.map((b, i) => {
            const x = 28 + (i * (W - 48)) / bins
            const bw = (W - 48) / bins - 1
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={H - 24 - (b.negative / maxBin) * 200}
                  width={bw}
                  height={(b.negative / maxBin) * 200}
                  fill={VIZ.b}
                  opacity={0.5}
                />
                <rect
                  x={x}
                  y={H - 24 - (b.positive / maxBin) * 200}
                  width={bw}
                  height={(b.positive / maxBin) * 200}
                  fill={VIZ.a}
                  opacity={0.65}
                />
              </g>
            )
          })}
          <line
            x1={28 + threshold * (W - 48)}
            y1={12}
            x2={28 + threshold * (W - 48)}
            y2={H - 24}
            stroke={VIZ.c}
            strokeWidth={3}
          />
          <text x={28 + threshold * (W - 48)} y={11} fill={VIZ.c} fontSize={10} textAnchor="middle">
            threshold
          </text>
        </Plot>
        <Plot w={W} h={H} aria-label="Matriz de confusão dois por dois">
          {matrix.map((cell, i) => {
            const col = i % 2
            const row = Math.floor(i / 2)
            const x = 82 + col * 190
            const y = 24 + row * 108
            return (
              <g key={cell.label}>
                <rect
                  x={x}
                  y={y}
                  width={174}
                  height={92}
                  rx={8}
                  fill={cell.color}
                  opacity={0.1 + (0.65 * cell.n) / 200}
                  stroke={cell.color}
                />
                <text x={x + 87} y={y + 39} fill={VIZ.ink} textAnchor="middle" fontSize={14}>
                  {cell.label}
                </text>
                <text x={x + 87} y={y + 65} fill={VIZ.ink} textAnchor="middle" fontSize={22}>
                  {cell.n}
                </text>
              </g>
            )
          })}
        </Plot>
      </div>
      <Controls cols={3}>
        <Slider
          label="threshold"
          value={threshold}
          onChange={setThreshold}
          min={0}
          max={1}
          step={0.01}
          format={(v) => v.toFixed(2)}
        />
        <Slider
          label="separação das classes"
          value={separation}
          onChange={setSeparation}
          min={0}
          max={1.7}
          step={0.05}
          format={(v) => v.toFixed(2)}
        />
        <Slider
          label="positivos"
          value={prevalence}
          onChange={setPrevalence}
          min={0.05}
          max={0.8}
          step={0.05}
          format={(v) => `${Math.round(v * 100)}%`}
        />
      </Controls>
      <Stats>
        <Stat label="acurácia" value={`${Math.round(accuracy * 100)}%`} />
        <Stat label="precisão" value={`${Math.round(precision * 100)}%`} tone="accent" />
        <Stat
          label="recall"
          value={`${Math.round(recall * 100)}%`}
          tone={recall < 0.5 ? 'rose' : 'emerald'}
        />
        <Stat label="F1" value={f1.toFixed(2)} />
      </Stats>
      <Caption>
        Baixe os positivos para 5% e suba o threshold: prever quase tudo como negativo dá acurácia
        alta, enquanto o recall despenca. A matriz mostra os positivos perdidos que a acurácia
        esconde.
      </Caption>
    </div>
  )
}
