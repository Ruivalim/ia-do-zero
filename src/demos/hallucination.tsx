import { useMemo, useState } from 'react'
import { Bar, Btn, Caption, Choice, Row, Stat, Stats, Toggle, VIZ } from '../components/ui'
import { useInterval } from '../lib/hooks'
import { entropy, fmt, softmax } from '../lib/mathx'

/* Onde a alucinação nasce: entropia alta = modelo inventando com confiança. */

type QId = 'sabe' | 'ambigua' | 'obscuro'

type Step = {
  top: { t: string; logit: number }[]
  pick: number
  /** when RAG is on, replace this step's distribution */
  rag?: { top: { t: string; logit: number }[]; pick: number }
}

type Question = {
  id: QId
  label: string
  prompt: string
  steps: Step[]
  doc: string
}

const QUESTIONS: Question[] = [
  {
    id: 'sabe',
    label: 'fato conhecido',
    prompt: 'A capital do Brasil é',
    doc: 'Brasília é a capital federal do Brasil desde 1960.',
    steps: [
      {
        top: [
          { t: 'Brasília', logit: 5.5 },
          { t: 'Rio', logit: 1.2 },
          { t: 'São', logit: 0.8 },
          { t: 'Salvador', logit: 0.3 },
          { t: 'a', logit: -0.5 },
        ],
        pick: 0,
      },
      {
        top: [
          { t: '.', logit: 4.0 },
          { t: ',', logit: 1.5 },
          { t: 'e', logit: 0.5 },
          { t: 'no', logit: 0.2 },
          { t: 'DF', logit: 0.1 },
        ],
        pick: 0,
      },
    ],
  },
  {
    id: 'ambigua',
    label: 'ambígua',
    prompt: 'O melhor framework web é',
    doc: 'Em 2024, pesquisas de satisfação citam frequentemente React e Vue entre os mais usados.',
    steps: [
      {
        top: [
          { t: 'React', logit: 2.4 },
          { t: 'Vue', logit: 2.2 },
          { t: 'Angular', logit: 1.9 },
          { t: 'Svelte', logit: 1.7 },
          { t: 'Django', logit: 1.4 },
        ],
        pick: 0,
        rag: {
          top: [
            { t: 'React', logit: 3.8 },
            { t: 'Vue', logit: 3.5 },
            { t: 'depende', logit: 2.0 },
            { t: 'Angular', logit: 1.0 },
            { t: 'Svelte', logit: 0.8 },
          ],
          pick: 2,
        },
      },
      {
        top: [
          { t: 'porque', logit: 2.0 },
          { t: 'para', logit: 1.8 },
          { t: 'em', logit: 1.2 },
          { t: '.', logit: 1.0 },
          { t: 'se', logit: 0.6 },
        ],
        pick: 0,
      },
      {
        top: [
          { t: 'é', logit: 2.2 },
          { t: 'popular', logit: 2.0 },
          { t: 'rápido', logit: 1.5 },
          { t: 'simples', logit: 1.3 },
          { t: 'moderno', logit: 1.1 },
        ],
        pick: 1,
      },
    ],
  },
  {
    id: 'obscuro',
    label: 'fato obscuro',
    prompt: 'Em 1873, o prefeito de Ouro Preto era',
    doc: 'Registros municipais listam Antônio de Souza como prefeito de Ouro Preto em 1873.',
    steps: [
      {
        top: [
          { t: 'José', logit: 1.4 },
          { t: 'Antônio', logit: 1.3 },
          { t: 'Pedro', logit: 1.2 },
          { t: 'Carlos', logit: 1.1 },
          { t: 'desconhecido', logit: 0.9 },
        ],
        pick: 0,
        rag: {
          top: [
            { t: 'Antônio', logit: 5.2 },
            { t: 'José', logit: 1.0 },
            { t: 'Pedro', logit: 0.6 },
            { t: 'Carlos', logit: 0.4 },
            { t: 'de', logit: 0.2 },
          ],
          pick: 0,
        },
      },
      {
        top: [
          { t: 'da', logit: 1.5 },
          { t: 'Silva', logit: 1.4 },
          { t: 'de', logit: 1.3 },
          { t: 'Costa', logit: 1.2 },
          { t: 'Santos', logit: 1.1 },
        ],
        pick: 1,
        rag: {
          top: [
            { t: 'de', logit: 4.5 },
            { t: 'Silva', logit: 1.0 },
            { t: 'da', logit: 0.8 },
            { t: 'Souza', logit: 0.5 },
            { t: 'Costa', logit: 0.3 },
          ],
          pick: 0,
        },
      },
      {
        top: [
          { t: 'e', logit: 1.3 },
          { t: 'Oliveira', logit: 1.2 },
          { t: 'soube-se', logit: 1.0 },
          { t: ',', logit: 0.9 },
          { t: 'neto', logit: 0.7 },
        ],
        pick: 1,
        rag: {
          top: [
            { t: 'Souza', logit: 5.0 },
            { t: 'Silva', logit: 0.8 },
            { t: '.', logit: 0.6 },
            { t: 'Oliveira', logit: 0.4 },
            { t: 'neto', logit: 0.2 },
          ],
          pick: 0,
        },
      },
      {
        top: [
          { t: '.', logit: 2.0 },
          { t: ',', logit: 1.2 },
          { t: 'segundo', logit: 0.8 },
          { t: 'em', logit: 0.5 },
          { t: 'oficial', logit: 0.3 },
        ],
        pick: 0,
      },
    ],
  },
]

function resolveStep(step: Step, rag: boolean) {
  if (rag && step.rag) return step.rag
  return { top: step.top, pick: step.pick }
}

export default function HallucinationDemo() {
  const [qid, setQid] = useState<QId>('obscuro')
  const [rag, setRag] = useState(false)
  const [stepIdx, setStepIdx] = useState(0)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  const q = QUESTIONS.find((x) => x.id === qid)!

  const resolved = useMemo(() => q.steps.map((s) => resolveStep(s, rag)), [q, rag])

  const phrase = useMemo(() => {
    const n = done ? resolved.length : stepIdx
    const toks = resolved.slice(0, n).map((s) => s.top[s.pick].t)
    return q.prompt + (toks.length ? ' ' + toks.join(' ') : '')
  }, [resolved, stepIdx, done, q.prompt])

  const showStep = done ? resolved.length - 1 : Math.min(stepIdx, resolved.length - 1)

  const entropies = useMemo(
    () =>
      resolved.map((s) =>
        entropy(
          softmax(
            s.top.map((t) => t.logit),
            1,
          ),
        ),
      ),
    [resolved],
  )
  const meanH = entropies.reduce((a, b) => a + b, 0) / entropies.length
  const maxHIdx = entropies.indexOf(Math.max(...entropies))
  const finalConf = Math.max(
    ...softmax(
      resolved[resolved.length - 1].top.map((t) => t.logit),
      1,
    ),
  )

  const tick = () => {
    setStepIdx((i) => {
      if (i + 1 >= resolved.length) {
        setRunning(false)
        setDone(true)
        return i
      }
      return i + 1
    })
  }

  useInterval(tick, 700, running)

  const reset = (next?: QId) => {
    setRunning(false)
    setStepIdx(0)
    setDone(false)
    if (next) setQid(next)
  }

  const curProbs = softmax(
    resolved[showStep].top.map((t) => t.logit),
    1,
  )
  const curH = entropy(curProbs)
  const highEntropy = curH > 1.8

  return (
    <div className="flex flex-col gap-4">
      <Row>
        <Choice
          value={qid}
          onChange={(v) => reset(v)}
          options={QUESTIONS.map((x) => ({ value: x.id, label: x.label }))}
        />
        <span className="ml-auto" />
        <Toggle
          label="com contexto recuperado"
          checked={rag}
          onChange={(v) => {
            setRag(v)
            reset()
          }}
        />
      </Row>

      {rag && (
        <div className="rounded-xl border border-violet/40 bg-violet/10 px-3 py-2 text-xs text-muted">
          <span className="font-semibold text-violet">documento: </span>
          {q.doc}
        </div>
      )}

      <div className="rounded-xl border border-line bg-surface-2/40 px-3.5 py-3 font-mono text-sm text-ink">
        {phrase}
        {!done && <span className="text-accent"> ▍</span>}
      </div>

      <div className="text-xs text-faint">
        passo {showStep + 1}/{resolved.length}
        {highEntropy && <span className="ml-2 text-rose">entropia alta — zona de invenção</span>}
      </div>

      <div className="flex flex-col gap-1.5">
        {resolved[showStep].top.map((t, i) => (
          <Bar
            key={t.t}
            label={t.t}
            value={curProbs[i]}
            color={highEntropy ? VIZ.e : i === resolved[showStep].pick ? VIZ.a : VIZ.f}
            highlight={i === resolved[showStep].pick || highEntropy}
            right={fmt(curProbs[i], 2)}
          />
        ))}
      </div>

      <div className="flex gap-1">
        {entropies.map((e, i) => (
          <div
            key={i}
            className="h-2 flex-1 rounded-full"
            style={{
              background: e > 1.8 ? VIZ.e : VIZ.d,
              opacity: i <= showStep ? 1 : 0.25,
            }}
            title={`passo ${i + 1}: ${fmt(e)} bits`}
          />
        ))}
      </div>

      <Row>
        <Btn
          onClick={() => {
            if (done) reset()
            setRunning((r) => !r)
          }}
          variant="primary"
        >
          {running ? 'Pausar' : done ? 'Reiniciar' : 'Gerar'}
        </Btn>
        <Btn
          onClick={() => {
            if (done) return
            tick()
          }}
          disabled={running || done}
        >
          Um token
        </Btn>
        <Btn onClick={() => reset()} variant="danger">
          Zerar
        </Btn>
      </Row>

      <Stats>
        <Stat label="entropia média" value={fmt(meanH)} unit="bits" />
        <Stat
          label="passo max H"
          value={maxHIdx + 1}
          tone={entropies[maxHIdx] > 1.8 ? 'rose' : 'ink'}
        />
        <Stat label="H deste passo" value={fmt(curH)} tone={highEntropy ? 'rose' : 'accent'} />
        <Stat
          label="confiança final"
          value={`${Math.round(finalConf * 100)}%`}
          tone={finalConf > 0.6 ? 'emerald' : 'amber'}
        />
      </Stats>

      <Caption>
        O modelo não distingue &quot;sei&quot; de &quot;não sei&quot;: sempre emite o token mais
        provável. Nos passos em rosa a entropia é alta — várias continuações quase equiprováveis — e
        é aí que nasce a alucinação. Com contexto recuperado (RAG), a distribuição do passo crítico
        fica picada e a resposta muda.
      </Caption>
    </div>
  )
}
