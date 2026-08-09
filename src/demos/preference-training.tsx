import { useMemo, useRef, useState } from 'react'
import {
  Btn,
  Caption,
  Controls,
  Legend,
  Panel,
  Plot,
  Row,
  Slider,
  Stat,
  Stats,
  Toggle,
  VIZ,
} from '../components/ui'
import { useRaf } from '../lib/hooks'
import { clamp, fmt, gaussian, lerp, mean, rng } from '../lib/mathx'

/* Preference training in a 1D toy space: the policy is a gaussian over a
   "style" axis (0 = terse, 1 = sycophantic). Each round the reader picks the
   better of two sampled answers and the policy slides toward whatever got
   rewarded. With the reward model on, choices first fit a reward curve
   (RLHF); off, the policy moves directly (DPO). */

const W = 520
const H = 320
const PAD = 34
const BASE = H - 64
const DOTS_Y = H - 30
const MU0 = 0.35
const SD0 = 0.22

const toX = (x: number) => PAD + x * (W - 2 * PAD)

const TEXTS: string[][] = [
  ['Não.', 'Não sei.'],
  ['Não. Isso não funciona desse jeito.', 'Resposta curta: não.'],
  [
    'Boa pergunta. A resposta curta é não, mas depende de alguns detalhes.',
    'Depende. Posso explicar os dois casos, se quiser.',
  ],
  [
    'Que pergunta absolutamente brilhante! Ficarei honrado em explicar tudo nos mínimos detalhes…',
    'Excelente ponto, genial como sempre! Deixe-me elaborar uma resposta completíssima…',
  ],
]

const textFor = (x: number, variant: number) => TEXTS[clamp(Math.floor(x * 4), 0, 3)][variant % 2]

const direcao = (mu: number) =>
  mu < 0.25 ? 'seco e curto' : mu < 0.5 ? 'direto' : mu < 0.75 ? 'educado' : 'bajulador'

function samplePair(round: number, mu: number, sd: number): [number, number] {
  const next = rng(round * 7919 + 1013)
  return [clamp(gaussian(next, mu, sd), 0.03, 0.97), clamp(gaussian(next, mu, sd), 0.03, 0.97)]
}

const density = (x: number, mu: number, sd: number) =>
  Math.exp(-((x - mu) ** 2) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI))

function curvePath(mu: number, sd: number, peak: number) {
  let d = ''
  for (let i = 0; i <= 50; i++) {
    const x = i / 50
    const y = BASE - Math.min(1, density(x, mu, sd) / peak) * (BASE - 22)
    d += `${i === 0 ? 'M' : 'L'}${toX(x).toFixed(1)},${y.toFixed(1)}`
  }
  return d
}

export default function PreferenceTrainingDemo() {
  const [pair, setPair] = useState<[number, number]>(() => samplePair(0, MU0, SD0))
  const [hist, setHist] = useState<number[]>([])
  const [round, setRound] = useState(0)
  const [lr, setLr] = useState(0.25)
  const [reward, setReward] = useState(true)
  const [view, setView] = useState({ mu: MU0, sd: SD0 })
  const [animating, setAnimating] = useState(false)
  const target = useRef({ mu: MU0, sd: SD0 })

  useRaf(() => {
    setView((v) => {
      const mu = lerp(v.mu, target.current.mu, 0.2)
      const sd = lerp(v.sd, target.current.sd, 0.2)
      const done =
        Math.abs(mu - target.current.mu) < 0.001 && Math.abs(sd - target.current.sd) < 0.001
      if (done) setAnimating(false)
      return done ? { ...target.current } : { mu, sd }
    })
  }, animating)

  const choose = (picked: 0 | 1) => {
    const x = pair[picked]
    const newHist = [...hist, x]
    const center = reward && newHist.length > 0 ? mean(newHist) : x
    const mu = clamp(target.current.mu + lr * (center - target.current.mu), 0.05, 0.95)
    const sd = Math.max(0.06, target.current.sd * 0.92)
    target.current = { mu, sd }
    const r = round + 1
    setHist(newHist)
    setRound(r)
    setPair(samplePair(r, mu, sd))
    setAnimating(true)
  }

  const reset = () => {
    target.current = { mu: MU0, sd: SD0 }
    setView({ mu: MU0, sd: SD0 })
    setAnimating(false)
    setHist([])
    setRound(0)
    setPair(samplePair(0, MU0, SD0))
  }

  const rewardMu = hist.length ? mean(hist) : 0.5
  const policyPath = useMemo(() => curvePath(view.mu, view.sd, 4), [view])
  const rewardPath = useMemo(
    () => (reward && hist.length ? curvePath(rewardMu, 0.13, 3.4) : null),
    [reward, hist.length, rewardMu],
  )

  return (
    <div className="flex flex-col gap-4">
      <Row>
        <Toggle label="modelo de recompensa (RLHF)" checked={reward} onChange={setReward} />
        <span className="ml-auto" />
        <Btn onClick={reset} variant="danger">
          Recomeçar
        </Btn>
      </Row>

      <Plot w={W} h={H} aria-label="Distribuição da política sobre o eixo de estilo das respostas">
        {rewardPath && (
          <path d={rewardPath} fill="none" stroke={VIZ.b} strokeWidth={2} strokeDasharray="5 4" />
        )}
        <path d={policyPath} fill="none" stroke={VIZ.a} strokeWidth={2.5} strokeLinejoin="round" />
        <line x1={PAD} y1={BASE} x2={W - PAD} y2={BASE} stroke={VIZ.axis} strokeWidth={1} />
        <line x1={PAD} y1={DOTS_Y} x2={W - PAD} y2={DOTS_Y} stroke={VIZ.axis} strokeWidth={1} />
        <text x={PAD} y={DOTS_Y + 16} fill={VIZ.axis} fontSize={10}>
          seco e curto
        </text>
        <text x={W - PAD} y={DOTS_Y + 16} fill={VIZ.axis} fontSize={10} textAnchor="end">
          prolixo e bajulador
        </text>
        {hist.map((x, i) => (
          <circle key={i} cx={toX(x)} cy={DOTS_Y} r={3.5} fill={VIZ.a} opacity={0.75} />
        ))}
        {pair.map((x, i) => (
          <g key={`c${round}-${i}`}>
            <circle
              cx={toX(x)}
              cy={DOTS_Y}
              r={7}
              fill={VIZ.surface}
              stroke={VIZ.c}
              strokeWidth={2}
            />
            <text x={toX(x)} y={DOTS_Y - 12} fill={VIZ.c} fontSize={10} textAnchor="middle">
              {i === 0 ? 'A' : 'B'}
            </text>
          </g>
        ))}
      </Plot>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {([0, 1] as const).map((i) => (
          <Panel key={i} title={`resposta ${i === 0 ? 'A' : 'B'}`}>
            <p className="min-h-12 text-sm text-ink">{textFor(pair[i], round * 2 + i)}</p>
            <Btn
              onClick={() => choose(i)}
              variant="primary"
              title={`Premiar a resposta ${i === 0 ? 'A' : 'B'}`}
            >
              {i === 0 ? 'prefiro A' : 'prefiro B'}
            </Btn>
          </Panel>
        ))}
      </div>

      <p className="text-xs text-muted">
        {reward
          ? 'RLHF: suas escolhas primeiro ajustam a curva de recompensa (violeta); a política sobe essa curva.'
          : 'DPO: sem curva intermediária — cada escolha puxa a política direto para a resposta preferida.'}
      </p>

      <Controls cols={1}>
        <Slider
          label="learning rate"
          value={lr}
          onChange={setLr}
          min={0.05}
          max={0.6}
          step={0.05}
          format={(v) => v.toFixed(2)}
          hint="Quanto cada escolha desloca a política. Alto demais faz a curva pular de um extremo ao outro."
        />
      </Controls>

      <Stats>
        <Stat label="rodadas" value={hist.length} />
        <Stat label="média da política" value={fmt(view.mu)} tone="accent" />
        <Stat label="variância" value={fmt(view.sd * view.sd, 3)} />
        <Stat
          label="para onde você empurra"
          value={direcao(view.mu)}
          tone={view.mu >= 0.75 ? 'amber' : 'ink'}
        />
      </Stats>

      <Legend
        items={[
          { color: VIZ.a, label: 'política (o que o modelo amostra)' },
          ...(reward ? [{ color: VIZ.b, label: 'recompensa inferida', dashed: true }] : []),
          { color: VIZ.c, label: 'candidatas desta rodada' },
        ]}
      />

      <Caption>
        Depois de umas oito escolhas a curva fica estreita em cima do que você premiou — o modelo
        não aprende a responder melhor, aprende a responder do jeito que você clicou. Premie só a
        resposta comprida e elogiosa e em poucas rodadas a política inteira vira bajulação: é o
        mesmo mecanismo que faz modelos reais concordarem com o usuário quando a preferência humana
        recompensa agrado em vez de acerto.
      </Caption>
    </div>
  )
}
