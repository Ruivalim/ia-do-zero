import { useMemo, useState } from 'react'
import {
  Badge,
  Caption,
  Choice,
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
import { fmt, gaussian, mean, rng } from '../lib/mathx'

/* Symmetric per-scale quantization: q = round(w/scale)·scale, with
   scale = max|w| / (2^(bits-1) − 1). INT2 is honest about having only two
   levels (±scale, no zero). The group toggle gives every 64-weight block its
   own scale — the trick that makes 4-bit usable in practice. */

const W = 520
const H = 250
const PAD = 34
const N = 256
const GROUP = 64
const GPU_GB = 12

type Prec = 'fp16' | 'int8' | 'int4' | 'int2'
const BITS: Record<Prec, number> = { fp16: 16, int8: 8, int4: 4, int2: 2 }
const LEVELS: Record<Prec, string> = { fp16: '65.536', int8: '255', int4: '15', int2: '2' }

const weights = (() => {
  const next = rng(2)
  return Array.from({ length: N }, () => gaussian(next, 0, 1))
})()

/* FP16 keeps a 10-bit mantissa: round to the ulp of each magnitude bin. */
function fp16round(w: number): number {
  if (w === 0) return 0
  const ulp = 2 ** (Math.floor(Math.log2(Math.abs(w))) - 10)
  return Math.round(w / ulp) * ulp
}

export default function QuantizationDemo() {
  const [prec, setPrec] = useState<Prec>('int4')
  const [sizeB, setSizeB] = useState(7)
  const [byGroup, setByGroup] = useState(false)

  const qweights = useMemo(() => {
    const gs = byGroup ? GROUP : N
    return weights.map((w, i) => {
      if (prec === 'fp16') return fp16round(w)
      const start = Math.floor(i / gs) * gs
      const maxAbs = Math.max(...weights.slice(start, start + gs).map(Math.abs))
      const maxInt = 2 ** (BITS[prec] - 1) - 1
      const scale = maxAbs / maxInt
      let k = Math.max(-maxInt, Math.min(maxInt, Math.round(w / scale)))
      if (BITS[prec] === 2 && k === 0) k = w >= 0 ? 1 : -1
      return k * scale
    })
  }, [prec, byGroup])

  const mae = useMemo(() => mean(weights.map((w, i) => Math.abs(w - qweights[i]))), [qweights])
  const maxAbsAll = useMemo(() => Math.max(...weights.map(Math.abs)) * 1.06, [])

  const BINS = 26
  const hist = useMemo(() => {
    const lo = Math.min(...weights)
    const hi = Math.max(...weights)
    const counts = new Array<number>(BINS).fill(0)
    for (const w of weights) counts[Math.min(BINS - 1, Math.floor(((w - lo) / (hi - lo)) * BINS))]++
    return { lo, hi, counts, max: Math.max(...counts) }
  }, [])

  const levels = useMemo(() => {
    if (prec === 'fp16')
      return Array.from({ length: 16 }, (_, i) => hist.lo + ((i + 0.5) / 16) * (hist.hi - hist.lo))
    const uniq = [...new Set(qweights.map((q) => Math.round(q * 1e5) / 1e5))].sort((a, b) => a - b)
    if (uniq.length <= 17) return uniq
    return Array.from({ length: 17 }, (_, i) => uniq[Math.round((i * (uniq.length - 1)) / 16)])
  }, [prec, qweights, hist])

  const ax = (v: number) => PAD + ((v - hist.lo) / (hist.hi - hist.lo)) * (W - 2 * PAD)
  const ay = (c: number) => H - PAD - (c / hist.max) * (H - 2 * PAD)
  const bx = (v: number) => PAD + ((v + maxAbsAll) / (2 * maxAbsAll)) * (W - 2 * PAD)
  const by = (v: number) => H - PAD - ((v + maxAbsAll) / (2 * maxAbsAll)) * (H - 2 * PAD)

  const memGB = (sizeB * BITS[prec]) / 8
  const fits = memGB <= GPU_GB

  return (
    <div className="flex flex-col gap-4">
      <Row>
        <Choice
          value={prec}
          onChange={setPrec}
          options={[
            { value: 'fp16', label: 'FP16', title: '16 bits de ponto flutuante — a referência' },
            { value: 'int8', label: 'INT8', title: '8 bits inteiros, 255 níveis' },
            { value: 'int4', label: 'INT4', title: '4 bits, só 15 níveis' },
            { value: 'int2', label: 'INT2', title: '2 níveis: +escala ou −escala, sem zero' },
          ]}
        />
        <span className="ml-auto" />
        <Toggle label="quantização por grupo (64)" checked={byGroup} onChange={setByGroup} />
      </Row>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Plot
          w={W}
          h={H}
          aria-label="Histograma dos pesos originais com os níveis de quantização sobrepostos"
        >
          {hist.counts.map((c, i) => (
            <rect
              key={i}
              x={ax(hist.lo + (i / BINS) * (hist.hi - hist.lo)) + 0.5}
              y={ay(c)}
              width={(W - 2 * PAD) / BINS - 1}
              height={H - PAD - ay(c)}
              fill={VIZ.b}
              opacity={0.55}
            />
          ))}
          {levels.map((lv, i) => (
            <line
              key={i}
              x1={ax(lv)}
              y1={PAD}
              x2={ax(lv)}
              y2={H - PAD}
              stroke={VIZ.c}
              strokeWidth={1.2}
              opacity={0.8}
            />
          ))}
          <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke={VIZ.axis} strokeWidth={1} />
          <text x={W - PAD} y={H - PAD + 16} fill={VIZ.axis} fontSize={11} textAnchor="end">
            valor do peso
          </text>
          {prec === 'fp16' && (
            <text x={W / 2} y={PAD - 8} fill={VIZ.muted} fontSize={11} textAnchor="middle">
              FP16: sem perda visível — os níveis seriam 65 mil
            </text>
          )}
        </Plot>

        <Plot w={W} h={H} aria-label="Peso original versus peso quantizado, formando uma escadinha">
          <line
            x1={bx(-maxAbsAll)}
            y1={by(-maxAbsAll)}
            x2={bx(maxAbsAll)}
            y2={by(maxAbsAll)}
            stroke={VIZ.axis}
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <line x1={PAD} y1={by(0)} x2={W - PAD} y2={by(0)} stroke={VIZ.grid} strokeWidth={1} />
          <line x1={bx(0)} y1={PAD} x2={bx(0)} y2={H - PAD} stroke={VIZ.grid} strokeWidth={1} />
          {weights.map((w, i) => (
            <circle key={i} cx={bx(w)} cy={by(qweights[i])} r={2.6} fill={VIZ.a} opacity={0.75} />
          ))}
          <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke={VIZ.axis} strokeWidth={1} />
          <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke={VIZ.axis} strokeWidth={1} />
          <text x={W - PAD} y={H - PAD + 16} fill={VIZ.axis} fontSize={11} textAnchor="end">
            peso original
          </text>
          <text x={PAD - 6} y={PAD - 8} fill={VIZ.axis} fontSize={11} textAnchor="end">
            quantizado
          </text>
        </Plot>
      </div>

      <Controls cols={1}>
        <Slider
          label="tamanho do modelo"
          value={sizeB}
          onChange={setSizeB}
          min={0.5}
          max={70}
          step={0.5}
          format={(v) => `${fmt(v, 1)}B parâmetros`}
          hint="Só afeta a conta de memória — o erro vem dos 256 pesos acima."
        />
      </Controls>

      <Stats>
        <Stat label="memória" value={fmt(memGB, memGB < 10 ? 2 : 1)} unit="GB" />
        <Stat
          label="erro médio |Δ|"
          value={fmt(mae, 4)}
          tone={mae < 0.01 ? 'emerald' : mae < 0.09 ? 'amber' : 'rose'}
        />
        <Stat label="níveis disponíveis" value={LEVELS[prec]} />
        <Stat
          label={`GPU de ${GPU_GB} GB`}
          value={<Badge tone={fits ? 'emerald' : 'rose'}>{fits ? 'cabe' : 'não cabe'}</Badge>}
        />
      </Stats>

      <Legend
        items={[
          { color: VIZ.b, label: 'pesos originais' },
          { color: VIZ.c, label: 'níveis de quantização' },
          { color: VIZ.a, label: '(original, quantizado)', dashed: true },
        ]}
      />

      <Caption>
        A escadinha do gráfico da direita é o preço de guardar cada peso em poucos bits. Em INT8 o
        degrau é tão fino que quase ninguém nota na prática. Em INT4 a escala global erra feio nos
        pesos pequenos — ligue a quantização por grupo e veja o erro médio cair, porque cada bloco
        de 64 pesos ganha a própria escala. Em INT2 só restam dois valores possíveis e a
        distribuição desmonta: memória mínima, modelo quebrado. É por isso que 4 bits com grupo
        virou o padrão para rodar modelo grande em GPU caseira.
      </Caption>
    </div>
  )
}
