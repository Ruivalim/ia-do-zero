import { useMemo, useState } from 'react'
import {
  Bar,
  Btn,
  Caption,
  Choice,
  Controls,
  Row,
  Slider,
  Stat,
  Stats,
  VIZ,
} from '../components/ui'
import { entropy, fmt, rng, sampleIndex, softmax } from '../lib/mathx'

/* Temperature, top-k e top-p sobre a mesma distribuição de candidatos. */

type Strategy = 'greedy' | 'topk' | 'topp' | 'puro'

type Ctx = {
  id: string
  prefix: string
  cands: { t: string; logit: number }[]
}

const CONTEXTS: Ctx[] = [
  {
    id: 'gato',
    prefix: 'O gato subiu no ',
    cands: [
      { t: 'telhado', logit: 4.2 },
      { t: 'muro', logit: 3.1 },
      { t: 'sofá', logit: 2.4 },
      { t: 'armário', logit: 1.8 },
      { t: 'chão', logit: 1.2 },
      { t: 'carro', logit: 0.6 },
      { t: 'computador', logit: 0.1 },
      { t: 'oceano', logit: -0.8 },
      { t: 'teoria', logit: -1.2 },
      { t: 'parlamento', logit: -1.5 },
      { t: 'álgebra', logit: -1.9 },
      { t: 'satélite', logit: -2.2 },
    ],
  },
  {
    id: 'ia',
    prefix: 'O modelo de linguagem ',
    cands: [
      { t: 'aprende', logit: 3.8 },
      { t: 'gera', logit: 3.4 },
      { t: 'prevê', logit: 2.9 },
      { t: 'processa', logit: 2.2 },
      { t: 'treina', logit: 1.6 },
      { t: 'alucina', logit: 1.0 },
      { t: 'esquece', logit: 0.4 },
      { t: 'dança', logit: -0.5 },
      { t: 'cozinhas', logit: -1.0 },
      { t: 'vota', logit: -1.4 },
      { t: 'planta', logit: -1.8 },
      { t: 'navega', logit: -2.0 },
    ],
  },
  {
    id: 'code',
    prefix: 'function soma(a, b) { return ',
    cands: [
      { t: 'a + b', logit: 5.0 },
      { t: 'a+b;', logit: 3.6 },
      { t: 'a - b', logit: 1.5 },
      { t: 'null', logit: 0.8 },
      { t: 'undefined', logit: 0.5 },
      { t: 'a * b', logit: 0.2 },
      { t: 'true', logit: -0.4 },
      { t: '"erro"', logit: -0.9 },
      { t: 'NaN', logit: -1.1 },
      { t: '[]', logit: -1.6 },
      { t: 'window', logit: -2.0 },
      { t: 'document', logit: -2.3 },
    ],
  },
]

function applyFilter(
  probs: number[],
  labels: string[],
  strategy: Strategy,
  k: number,
  p: number,
): { probs: number[]; alive: boolean[] } {
  const n = probs.length
  const alive = new Array(n).fill(true)
  const order = probs.map((_, i) => i).sort((a, b) => probs[b] - probs[a])

  if (strategy === 'greedy') {
    for (let i = 0; i < n; i++) alive[i] = false
    alive[order[0]] = true
  } else if (strategy === 'topk') {
    const keep = new Set(order.slice(0, k))
    for (let i = 0; i < n; i++) alive[i] = keep.has(i)
  } else if (strategy === 'topp') {
    let acc = 0
    const keep = new Set<number>()
    for (const i of order) {
      keep.add(i)
      acc += probs[i]
      if (acc >= p) break
    }
    for (let i = 0; i < n; i++) alive[i] = keep.has(i)
  }

  const filtered = probs.map((v, i) => (alive[i] ? v : 0))
  const s = filtered.reduce((a, b) => a + b, 0)
  const renorm = s > 0 ? filtered.map((v) => v / s) : filtered
  void labels
  return { probs: renorm, alive }
}

export default function SamplingDemo() {
  const [ctxId, setCtxId] = useState(CONTEXTS[0].id)
  const [temp, setTemp] = useState(1)
  const [k, setK] = useState(5)
  const [p, setP] = useState(0.9)
  const [strategy, setStrategy] = useState<Strategy>('topp')
  const [phrase, setPhrase] = useState('')
  const [last, setLast] = useState<string | null>(null)
  const [seed, setSeed] = useState(42)

  const ctx = CONTEXTS.find((c) => c.id === ctxId)!
  const logits = ctx.cands.map((c) => c.logit)
  const labels = ctx.cands.map((c) => c.t)

  const rawProbs = useMemo(() => softmax(logits, Math.max(0.01, temp)), [logits, temp])

  const { probs, alive } = useMemo(
    () => applyFilter(rawProbs, labels, strategy, k, p),
    [rawProbs, labels, strategy, k, p],
  )

  const aliveCount = alive.filter(Boolean).length
  const topP = Math.max(...probs)
  const H = useMemo(() => {
    const live = probs.map((v, i) => (alive[i] ? v : 0))
    const s = live.reduce((a, b) => a + b, 0)
    return entropy(s > 0 ? live.map((v) => v / s) : [1])
  }, [probs, alive])

  const drawOne = (next: () => number) => {
    const u = next()
    const idx = sampleIndex(probs, u)
    return labels[idx]
  }

  const sortear = () => {
    const next = rng(seed)
    setSeed((s) => s + 1)
    const tok = drawOne(next)
    setLast(tok)
    setPhrase((ph) => (ph ? `${ph} ${tok}` : ctx.prefix + tok))
  }

  const gerar8 = () => {
    const next = rng(seed)
    setSeed((s) => s + 8)
    let acc = phrase || ctx.prefix
    let tok = last
    for (let i = 0; i < 8; i++) {
      tok = drawOne(next)
      acc = acc.endsWith(' ') || acc === ctx.prefix ? acc + tok : `${acc} ${tok}`
    }
    setLast(tok)
    setPhrase(acc)
  }

  return (
    <div className="flex flex-col gap-4">
      <Row>
        <Choice
          label="contexto"
          value={ctxId}
          onChange={(v) => {
            setCtxId(v)
            setPhrase('')
            setLast(null)
          }}
          options={CONTEXTS.map((c) => ({
            value: c.id,
            label: c.prefix.trim().slice(0, 18) + '…',
          }))}
        />
      </Row>

      <div className="rounded-xl border border-line bg-surface-2/40 px-3.5 py-2.5 font-mono text-sm text-ink">
        {phrase || (
          <span className="text-faint">
            {ctx.prefix}
            <span className="text-accent">_</span>
          </span>
        )}
      </div>

      <Choice
        value={strategy}
        onChange={setStrategy}
        options={[
          { value: 'greedy', label: 'greedy' },
          { value: 'topk', label: 'top-k' },
          { value: 'topp', label: 'top-p' },
          { value: 'puro', label: 'puro' },
        ]}
      />

      <div className="flex flex-col gap-1.5">
        {ctx.cands.map((c, i) => (
          <div key={c.t} className={alive[i] ? '' : 'line-through opacity-70'}>
            <Bar
              label={c.t}
              value={probs[i]}
              color={alive[i] ? VIZ.a : VIZ.muted}
              highlight={alive[i]}
              right={fmt(probs[i], 3)}
            />
          </div>
        ))}
      </div>

      <Controls cols={3}>
        <Slider
          label="temperature"
          value={temp}
          onChange={setTemp}
          min={0.01}
          max={2}
          step={0.01}
          format={(v) => v.toFixed(2)}
          hint="Baixa concentra; alta espalha"
        />
        <Slider
          label="top-k"
          value={k}
          onChange={setK}
          min={1}
          max={12}
          step={1}
          disabled={strategy !== 'topk'}
        />
        <Slider
          label="top-p"
          value={p}
          onChange={setP}
          min={0.05}
          max={1}
          step={0.01}
          format={(v) => v.toFixed(2)}
          disabled={strategy !== 'topp'}
        />
      </Controls>

      <Row>
        <Btn onClick={sortear} variant="primary">
          Sortear
        </Btn>
        <Btn onClick={gerar8}>Gerar 8 tokens</Btn>
        <Btn
          onClick={() => {
            setPhrase('')
            setLast(null)
          }}
          variant="danger"
        >
          Limpar
        </Btn>
      </Row>

      <Stats>
        <Stat label="entropia" value={fmt(H)} unit="bits" tone="accent" />
        <Stat label="vivos" value={aliveCount} />
        <Stat label="P(topo)" value={fmt(topP, 3)} />
        <Stat label="sorteado" value={last ?? '—'} tone={last ? 'violet' : 'ink'} />
      </Stats>

      <Caption>
        Temperature 0.1 esmaga a distribuição num único token; 1.8 devolve chance à cauda. Top-k
        corta um número fixo de candidatos; top-p corta a cauda até somar p de massa de
        probabilidade e preserva mais diversidade quando o topo já é dominante.
      </Caption>
    </div>
  )
}
