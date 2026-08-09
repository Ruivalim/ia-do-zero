import { useMemo, useState } from 'react'
import {
  Bar,
  Btn,
  Caption,
  Choice,
  Controls,
  Plot,
  Row,
  Slider,
  Stat,
  Stats,
  VIZ,
} from '../components/ui'
import { useInterval } from '../lib/hooks'
import { compact, fmt, softmax } from '../lib/mathx'

/* Roteador MoE: top-k experts por token e histograma de carga. */

const W = 520
const H = 160

type SeqId = 'code' | 'pt' | 'math'

type Seq = {
  id: SeqId
  label: string
  tokens: string[]
  /** base affinity per expert index 0..15 for each token — hand-written */
  routes: number[][]
}

const SEQS: Seq[] = [
  {
    id: 'code',
    label: 'código',
    tokens: ['const', 'sum', '=', '(', 'a', ',', 'b', ')', '=>', 'a+b'],
    routes: [
      [3, 0.2, 0.1, 2.5, 0.1, 0.2, 0.1, 0.1, 0.3, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      [2.8, 0.3, 0.2, 2.2, 0.2, 0.1, 0.1, 0.1, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      [0.2, 0.2, 3, 0.3, 0.1, 0.1, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      [0.1, 2.5, 0.3, 0.2, 2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      [2.5, 0.2, 0.2, 2, 0.3, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      [0.1, 2.2, 0.2, 0.2, 1.8, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      [2.4, 0.2, 0.2, 2.1, 0.2, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      [0.1, 2.3, 0.2, 0.2, 1.9, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      [0.3, 0.2, 2.8, 0.4, 0.2, 0.2, 0.3, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      [2.6, 0.3, 0.3, 2.4, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
    ],
  },
  {
    id: 'pt',
    label: 'português',
    tokens: ['O', 'gato', 'preto', 'dorme', 'no', 'sofá', 'da', 'sala', 'toda', 'tarde'],
    routes: [
      [0.2, 0.1, 0.1, 0.2, 2.5, 2.2, 0.3, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      [0.1, 0.2, 0.1, 0.1, 2.8, 2.0, 0.4, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      [0.2, 0.1, 0.2, 0.1, 2.4, 2.3, 0.3, 0.3, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      [0.1, 0.1, 0.1, 0.2, 2.2, 2.5, 0.5, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      [0.3, 0.2, 0.1, 0.1, 1.8, 1.5, 2.0, 0.4, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      [0.1, 0.1, 0.2, 0.1, 2.6, 2.1, 0.3, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      [0.2, 0.1, 0.1, 0.1, 1.5, 1.4, 2.2, 0.5, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      [0.1, 0.2, 0.1, 0.1, 2.3, 2.4, 0.4, 0.3, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      [0.2, 0.1, 0.1, 0.2, 2.0, 1.9, 0.6, 0.4, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      [0.1, 0.1, 0.2, 0.1, 2.1, 2.2, 0.5, 0.3, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
    ],
  },
  {
    id: 'math',
    label: 'matemática',
    tokens: ['∫', 'x²', 'dx', '=', 'x³', '/', '3', '+', 'C', '.'],
    routes: [
      [0.1, 0.1, 0.2, 0.1, 0.1, 0.1, 2.8, 2.5, 0.3, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      [0.1, 0.2, 0.1, 0.1, 0.1, 0.1, 2.6, 2.4, 0.4, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      [0.2, 0.1, 0.1, 0.2, 0.1, 0.1, 2.5, 2.3, 0.3, 0.3, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      [0.1, 0.1, 0.3, 0.1, 0.2, 0.1, 1.5, 1.4, 2.0, 0.4, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 2.7, 2.6, 0.3, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      [0.1, 0.2, 0.1, 0.1, 0.1, 0.1, 1.8, 1.6, 1.5, 0.5, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 2.4, 2.2, 0.8, 0.4, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      [0.2, 0.1, 0.2, 0.1, 0.1, 0.1, 1.2, 1.1, 2.2, 0.6, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 2.0, 2.1, 1.0, 0.5, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.8, 0.7, 1.5, 1.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
    ],
  },
]

// illustrative param counts
const PARAMS_PER_EXPERT = 1.5e8
const SHARED_PARAMS = 4e8

export default function MoeRouterDemo() {
  const [seqId, setSeqId] = useState<SeqId>('code')
  const [nExperts, setNExperts] = useState(8)
  const [topK, setTopK] = useState(2)
  const [idx, setIdx] = useState(0)
  const [running, setRunning] = useState(false)
  const [loads, setLoads] = useState<number[]>(() => new Array(16).fill(0))

  const seq = SEQS.find((s) => s.id === seqId)!
  const token = seq.tokens[idx]
  const logits = seq.routes[idx].slice(0, nExperts)
  const weights = softmax(logits, 1)

  const active = useMemo(() => {
    return weights
      .map((w, i) => ({ i, w }))
      .sort((a, b) => b.w - a.w)
      .slice(0, topK)
  }, [weights, topK])

  const activeSet = new Set(active.map((a) => a.i))

  const totalParams = SHARED_PARAMS + nExperts * PARAMS_PER_EXPERT
  const activeParams = SHARED_PARAMS + topK * PARAMS_PER_EXPERT
  const pctActive = (activeParams / totalParams) * 100
  const maxLoad = Math.max(0, ...loads.slice(0, nExperts))
  const busiest = loads.slice(0, nExperts).indexOf(maxLoad)

  const applyLoad = (i: number) => {
    const w = softmax(seq.routes[i].slice(0, nExperts), 1)
    const top = w
      .map((p, j) => ({ j, p }))
      .sort((a, b) => b.p - a.p)
      .slice(0, topK)
    setLoads((prev) => {
      const next = prev.slice()
      for (const t of top) next[t.j] += 1
      return next
    })
  }

  useInterval(
    () => {
      setIdx((i) => {
        applyLoad(i)
        if (i + 1 >= seq.tokens.length) {
          setRunning(false)
          return i
        }
        return i + 1
      })
    },
    550,
    running,
  )

  const reset = (id?: SeqId) => {
    setRunning(false)
    setIdx(0)
    setLoads(new Array(16).fill(0))
    if (id) setSeqId(id)
  }

  const step = () => {
    applyLoad(idx)
    setIdx((i) => Math.min(seq.tokens.length - 1, i + 1))
  }

  // expert boxes
  const cols = Math.min(8, nExperts)
  const rows = Math.ceil(nExperts / cols)
  const boxW = (W - 20) / cols
  const boxH = (H - 20) / rows

  return (
    <div className="flex flex-col gap-4">
      <Row>
        <Choice
          value={seqId}
          onChange={(v) => reset(v)}
          options={SEQS.map((s) => ({ value: s.id, label: s.label }))}
        />
        <span className="ml-auto" />
        <Btn
          onClick={() => {
            if (idx >= seq.tokens.length - 1 && !running) reset()
            setRunning((r) => !r)
          }}
          variant="primary"
        >
          {running ? 'Pausar' : 'Rodar'}
        </Btn>
        <Btn onClick={step} disabled={running}>
          Um passo
        </Btn>
        <Btn onClick={() => reset()} variant="danger">
          Zerar
        </Btn>
      </Row>

      <div className="flex flex-wrap gap-1.5 font-mono text-sm">
        {seq.tokens.map((t, i) => (
          <span
            key={i}
            className={`rounded-md border px-2 py-1 ${
              i === idx
                ? 'border-accent bg-accent/15 text-ink'
                : i < idx
                  ? 'border-line bg-surface-2 text-muted'
                  : 'border-line text-faint'
            }`}
          >
            {t}
          </span>
        ))}
      </div>

      <Plot w={W} h={H} aria-label="Experts do MoE">
        {Array.from({ length: nExperts }, (_, i) => {
          const col = i % cols
          const row = Math.floor(i / cols)
          const x = 10 + col * boxW
          const y = 10 + row * boxH
          const on = activeSet.has(i)
          const load = loads[i]
          return (
            <g key={i}>
              <rect
                x={x + 4}
                y={y + 4}
                width={boxW - 8}
                height={boxH - 8}
                rx={6}
                fill={on ? VIZ.a : VIZ.surface}
                opacity={on ? 0.35 : 0.5}
                stroke={on ? VIZ.a : VIZ.border}
                strokeWidth={on ? 2 : 1}
              />
              <text
                x={x + boxW / 2}
                y={y + boxH / 2 - 2}
                textAnchor="middle"
                fill={VIZ.ink}
                fontSize={11}
              >
                E{i}
              </text>
              <text
                x={x + boxW / 2}
                y={y + boxH / 2 + 12}
                textAnchor="middle"
                fill={VIZ.muted}
                fontSize={9}
              >
                {load}
              </text>
            </g>
          )
        })}
      </Plot>

      <div className="flex flex-col gap-1">
        <div className="text-xs text-faint">pesos do roteador · token &quot;{token}&quot;</div>
        {weights.map((w, i) => (
          <Bar
            key={i}
            label={`E${i}`}
            value={w}
            color={activeSet.has(i) ? VIZ.a : VIZ.muted}
            highlight={activeSet.has(i)}
            right={fmt(w, 2)}
          />
        ))}
      </div>

      <Controls cols={2}>
        <Slider
          label="experts ativos / token"
          value={topK}
          onChange={setTopK}
          min={1}
          max={4}
          step={1}
        />
        <Slider
          label="nº total de experts"
          value={nExperts}
          onChange={(v) => {
            setNExperts(v)
            setLoads(new Array(16).fill(0))
            setIdx(0)
            setRunning(false)
          }}
          min={4}
          max={16}
          step={1}
        />
      </Controls>

      <Stats>
        <Stat label="params totais" value={compact(totalParams)} />
        <Stat label="ativos / token" value={compact(activeParams)} tone="accent" />
        <Stat label="% ativo" value={`${fmt(pctActive, 0)}%`} />
        <Stat
          label="mais carregado"
          value={maxLoad > 0 ? `E${busiest} (${maxLoad})` : '—'}
          tone="amber"
        />
      </Stats>

      <Caption>
        Capacidade de gigante, custo de médio: só {topK} de {nExperts} experts rodam por token.
        Tokens de código preferem os mesmos experts — o histograma de carga desbalanceia. Esse
        desbalanceamento é o problema real de treinar MoE, não só a matemática do roteador.
      </Caption>
    </div>
  )
}
