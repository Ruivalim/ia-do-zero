import { useMemo, useState } from 'react'
import {
  Badge,
  Btn,
  Caption,
  Controls,
  Panel,
  Row,
  Slider,
  Stat,
  Stats,
  Toggle,
} from '../components/ui'
import { useInterval } from '../lib/hooks'

/* Loop de agente: pensamento → ferramenta → observação → resposta. */

type Kind = 'thought' | 'tool' | 'obs' | 'final' | 'error'

type Card = {
  kind: Kind
  title: string
  body: string
  tokens: number
}

const HAPPY: Card[] = [
  {
    kind: 'thought',
    title: 'pensamento',
    body: 'Preciso da média de vendas da última semana e da meta. Vou buscar as vendas primeiro.',
    tokens: 48,
  },
  {
    kind: 'tool',
    title: 'chamada · buscar_vendas',
    body: '{"nome":"buscar_vendas","args":{"periodo":"ultima_semana"}}',
    tokens: 32,
  },
  {
    kind: 'obs',
    title: 'observação',
    body: '{"dias":[6200,7100,6800,7400,6900,5500,4800],"moeda":"BRL"}',
    tokens: 56,
  },
  {
    kind: 'thought',
    title: 'pensamento',
    body: 'Tenho os 7 dias. Agora calculo a média e leio a meta para comparar.',
    tokens: 40,
  },
  {
    kind: 'tool',
    title: 'chamada · calcular',
    body: '{"nome":"calcular","args":{"expr":"mean([6200,7100,6800,7400,6900,5500,4800])"}}',
    tokens: 48,
  },
  {
    kind: 'obs',
    title: 'observação',
    body: '{"resultado":6385.71}',
    tokens: 18,
  },
  {
    kind: 'tool',
    title: 'chamada · ler_meta',
    body: '{"nome":"ler_meta","args":{"periodo":"semanal"}}',
    tokens: 28,
  },
  {
    kind: 'obs',
    title: 'observação',
    body: '{"meta":6000,"unidade":"BRL/dia"}',
    tokens: 22,
  },
  {
    kind: 'final',
    title: 'resposta final',
    body: 'A média diária da última semana foi R$ 6.385,71, acima da meta de R$ 6.000 (+6,4%).',
    tokens: 52,
  },
]

const FAIL_PATH: Card[] = [
  HAPPY[0],
  HAPPY[1],
  HAPPY[2],
  HAPPY[3],
  {
    kind: 'tool',
    title: 'chamada · calcular',
    body: '{"nome":"calcular","args":{"expr":"media(vendas)"}}',
    tokens: 40,
  },
  {
    kind: 'error',
    title: 'erro da ferramenta',
    body: '{"erro":"NameError: media não definida. Use mean([...])."}',
    tokens: 24,
  },
  {
    kind: 'thought',
    title: 'pensamento',
    body: 'A ferramenta falhou. Vou reescrever a expressão com mean e a lista explícita.',
    tokens: 42,
  },
  {
    kind: 'tool',
    title: 'chamada · calcular (retry)',
    body: '{"nome":"calcular","args":{"expr":"mean([6200,7100,6800,7400,6900,5500,4800])"}}',
    tokens: 48,
  },
  {
    kind: 'obs',
    title: 'observação',
    body: '{"resultado":6385.71}',
    tokens: 18,
  },
  HAPPY[6],
  HAPPY[7],
  {
    kind: 'final',
    title: 'resposta final',
    body: 'Após corrigir a chamada, a média foi R$ 6.385,71 — bate a meta de R$ 6.000.',
    tokens: 48,
  },
]

const NO_TOOLS: Card[] = [
  {
    kind: 'thought',
    title: 'pensamento',
    body: 'Sem ferramentas. Vou chutar com base em conhecimento genérico de varejo.',
    tokens: 36,
  },
  {
    kind: 'final',
    title: 'resposta final (chute)',
    body: 'Diria que a média ficou em torno de R$ 5.000 e talvez não bata a meta — mas não tenho os dados.',
    tokens: 44,
  },
]

const KIND_TONE: Record<Kind, 'neutral' | 'accent' | 'violet' | 'emerald' | 'rose' | 'amber'> = {
  thought: 'violet',
  tool: 'accent',
  obs: 'emerald',
  final: 'emerald',
  error: 'rose',
}

export default function AgentLoopDemo() {
  const [fail, setFail] = useState(false)
  const [noTools, setNoTools] = useState(false)
  const [step, setStep] = useState(0)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(900)

  const script = useMemo(() => {
    if (noTools) return NO_TOOLS
    if (fail) return FAIL_PATH
    return HAPPY
  }, [fail, noTools])

  const visible = script.slice(0, step)
  const tokens = visible.reduce((s, c) => s + c.tokens, 0)
  const toolCalls = visible.filter((c) => c.kind === 'tool').length
  useInterval(
    () => {
      setStep((s) => {
        if (s >= script.length) {
          setRunning(false)
          return s
        }
        return s + 1
      })
    },
    speed,
    running,
  )

  const reset = () => {
    setRunning(false)
    setStep(0)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-line bg-surface-2/40 px-3 py-2 text-sm text-muted">
        Tarefa:{' '}
        <span className="text-ink">
          Qual foi a média de vendas da última semana e isso bate a meta?
        </span>
      </div>

      <Row>
        <Btn
          onClick={() => {
            if (step >= script.length) reset()
            setRunning((r) => !r)
          }}
          variant="primary"
        >
          {running ? 'Pausar' : step >= script.length ? 'Reiniciar' : 'Rodar'}
        </Btn>
        <Btn
          onClick={() => setStep((s) => Math.min(script.length, s + 1))}
          disabled={running || step >= script.length}
        >
          Próximo passo
        </Btn>
        <Btn onClick={reset} variant="danger">
          Reiniciar
        </Btn>
        <span className="ml-auto" />
        <Toggle
          label="ferramenta falha"
          checked={fail}
          onChange={(v) => {
            setFail(v)
            if (v) setNoTools(false)
            reset()
          }}
        />
        <Toggle
          label="sem ferramentas"
          checked={noTools}
          onChange={(v) => {
            setNoTools(v)
            if (v) setFail(false)
            reset()
          }}
        />
      </Row>

      <Controls cols={1}>
        <Slider
          label="velocidade (ms / passo)"
          value={speed}
          onChange={setSpeed}
          min={300}
          max={2000}
          step={100}
        />
      </Controls>

      <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
        {visible.length === 0 && (
          <p className="text-sm text-faint">
            Pressione Rodar ou Próximo passo para iniciar o loop.
          </p>
        )}
        {visible.map((c, i) => (
          <Panel key={i} className="!p-2.5">
            <div className="mb-1 flex items-center gap-2">
              <Badge tone={KIND_TONE[c.kind]}>{c.title}</Badge>
              <span className="text-[10px] text-faint">{c.tokens} tok</span>
            </div>
            <pre className="whitespace-pre-wrap font-mono text-xs text-ink">{c.body}</pre>
          </Panel>
        ))}
      </div>

      <Stats>
        <Stat label="passos" value={step} />
        <Stat label="chamadas de ferramenta" value={toolCalls} tone="accent" />
        <Stat label="tokens acumulados" value={tokens} tone="amber" />
        <Stat
          label="resultado"
          value={visible.some((c) => c.kind === 'final') ? (noTools ? 'chute' : 'ok') : '…'}
          tone={visible.some((c) => c.kind === 'final') ? (noTools ? 'rose' : 'emerald') : 'ink'}
        />
      </Stats>

      <Caption>
        O modelo nunca executa nada: ele devolve um pedido em JSON e o loop de código roda a
        ferramenta, devolve a observação e pergunta de novo. Cada volta acumula tokens — o custo do
        agente cresce com o número de iterações, não só com a resposta final.
      </Caption>
    </div>
  )
}
