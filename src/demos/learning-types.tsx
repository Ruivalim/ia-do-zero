import { useMemo, useState } from 'react'
import {
  Btn,
  Caption,
  Choice,
  Grid,
  Legend,
  Panel,
  Plot,
  Row,
  SERIES,
  Stat,
  Stats,
  VIZ,
} from '../components/ui'
import { useInterval } from '../lib/hooks'
import { clamp, fmt, gaussian, mean, rng, round } from '../lib/mathx'

/* The same ~50 points read three ways: with labels (supervised), without
   labels (k-means finds the clouds on its own), and as an environment an
   agent crosses for reward (RL). The data never changes — the question does. */

const W = 520
const H = 320
const PAD = 30
const GRID = 8

type Pt = { x: number; y: number; label: 0 | 1 }

function makeData(): Pt[] {
  const next = rng(4)
  const clouds: [number, number, 0 | 1, number][] = [
    [0.22, 0.26, 0, 17],
    [0.74, 0.22, 0, 17],
    [0.72, 0.74, 1, 16],
  ]
  const out: Pt[] = []
  for (const [cx, cy, label, n] of clouds)
    for (let i = 0; i < n; i++)
      out.push({
        x: clamp(gaussian(next, cx, 0.085), 0.04, 0.96),
        y: clamp(gaussian(next, cy, 0.085), 0.04, 0.96),
        label,
      })
  return out
}

const DATA = makeData()

const toPx = (x: number) => PAD + x * (W - 2 * PAD)
const toPy = (y: number) => H - PAD - y * (H - 2 * PAD)

/* perceptron-style pass until the two labels separate */
function trainBoundary(data: Pt[]) {
  let w1 = 0.4
  let w2 = -0.3
  let b = 0.1
  for (let epoch = 0; epoch < 60; epoch++) {
    let errors = 0
    for (const s of data) {
      const pred = w1 * s.x + w2 * s.y + b >= 0 ? 1 : 0
      const d = s.label - pred
      if (d !== 0) {
        w1 += 0.15 * d * s.x
        w2 += 0.15 * d * s.y
        b += 0.15 * d
        errors++
      }
    }
    if (errors === 0) break
  }
  return { w1, w2, b }
}

const B = trainBoundary(DATA)
const ACC =
  DATA.filter((s) => (B.w1 * s.x + B.w2 * s.y + B.b >= 0 ? 1 : 0) === s.label).length / DATA.length

const BOUNDARY: [number, number][] = (() => {
  const pts: [number, number][] = []
  if (Math.abs(B.w2) > 1e-9) {
    const y0 = -B.b / B.w2
    const y1 = -(B.w1 + B.b) / B.w2
    if (y0 >= 0 && y0 <= 1) pts.push([0, y0])
    if (y1 >= 0 && y1 <= 1) pts.push([1, y1])
  }
  if (pts.length < 2 && Math.abs(B.w1) > 1e-9) {
    const x0 = -B.b / B.w1
    const x1 = -(B.w2 + B.b) / B.w1
    if (x0 >= 0 && x0 <= 1) pts.push([x0, 0])
    if (x1 >= 0 && x1 <= 1) pts.push([x1, 1])
  }
  return pts
})()

function kmeans(data: Pt[], k: number) {
  const next = rng(9)
  let centroids = Array.from({ length: k }, () => {
    const p = data[Math.floor(next() * data.length)]
    return { x: p.x, y: p.y }
  })
  let assign = new Array<number>(data.length).fill(-1)
  for (let it = 0; it < 30; it++) {
    let moved = false
    assign = data.map((s, i) => {
      let best = 0
      let bd = Infinity
      centroids.forEach((c, j) => {
        const d = (c.x - s.x) ** 2 + (c.y - s.y) ** 2
        if (d < bd) {
          bd = d
          best = j
        }
      })
      if (best !== assign[i]) moved = true
      return best
    })
    centroids = centroids.map((c, j) => {
      const mine = data.filter((_, i) => assign[i] === j)
      return mine.length ? { x: mean(mine.map((m) => m.x)), y: mean(mine.map((m) => m.y)) } : c
    })
    if (!moved) break
  }
  return { assign, centroids }
}

const KM = kmeans(DATA, 3)

type Episode = { path: [number, number][]; reward: number; eps: number }

function genEpisode(next: () => number, eps: number): Episode {
  let x = 0
  let y = 0
  const path: [number, number][] = [[0, 0]]
  let reward = 0
  for (let s = 0; s < 40; s++) {
    let dx = 0
    let dy = 0
    if (next() < eps) {
      const m = Math.floor(next() * 4)
      dx = [1, -1, 0, 0][m]
      dy = [0, 0, 1, -1][m]
    } else if (next() < 0.5) dx = 1
    else dy = 1
    x = clamp(x + dx, 0, GRID - 1)
    y = clamp(y + dy, 0, GRID - 1)
    path.push([x, y])
    reward -= 0.1
    if (x === GRID - 1 && y === GRID - 1) {
      reward += 10
      break
    }
  }
  return { path, reward: round(reward, 1), eps }
}

const CELL = (H - 2 * PAD) / GRID
const X0 = (W - CELL * GRID) / 2
const cellX = (i: number) => X0 + (i + 0.5) * CELL
const cellY = (j: number) => H - PAD - (j + 0.5) * CELL

type Mode = 'sup' | 'nsup' | 'ref'

const PANEL_TEXT: Record<Mode, [string, string, string]> = {
  sup: [
    'exemplos com a resposta certa (rótulos)',
    'uma regra que rotula exemplos novos',
    'filtro de spam treinado com e-mails marcados por pessoas',
  ],
  nsup: [
    'os dados crus, sem resposta nenhuma',
    'grupos que aparecem sozinhos',
    'segmentar clientes por comportamento de compra',
  ],
  ref: [
    'recompensas por ação, nunca a resposta',
    'uma política: o que fazer em cada situação',
    'robô que aprende a andar por tentativa e erro',
  ],
}

export default function LearningTypesDemo() {
  const [mode, setMode] = useState<Mode>('sup')
  const [count, setCount] = useState(1)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(true)

  const episodes = useMemo(
    () => Array.from({ length: count }, (_, k) => genEpisode(rng(100 + k), 0.85 * 0.65 ** k)),
    [count],
  )
  const current = episodes[episodes.length - 1]
  const atEnd = step >= current.path.length - 1

  useInterval(
    () => {
      if (atEnd) {
        setPlaying(false)
        return
      }
      setStep((s) => s + 1)
    },
    110,
    mode === 'ref' && playing,
  )

  const choose = (m: Mode) => {
    setMode(m)
    if (m === 'ref') {
      setStep(0)
      setPlaying(true)
    }
  }

  const newEpisode = () => {
    setCount((c) => c + 1)
    setStep(0)
    setPlaying(true)
  }

  const txt = PANEL_TEXT[mode]
  const head = current.path[Math.min(step, current.path.length - 1)]

  return (
    <div className="flex flex-col gap-4">
      <Row>
        <Choice
          value={mode}
          onChange={choose}
          options={[
            { value: 'sup', label: 'Supervisionado' },
            { value: 'nsup', label: 'Não supervisionado' },
            { value: 'ref', label: 'Por reforço' },
          ]}
        />
        {mode === 'ref' && (
          <>
            <span className="ml-auto" />
            <Btn onClick={() => setPlaying((v) => !v)}>{playing ? 'Pausar' : 'Continuar'}</Btn>
            <Btn onClick={newEpisode} variant="primary">
              Novo episódio
            </Btn>
          </>
        )}
      </Row>

      <Plot w={W} h={H} aria-label="Os mesmos 50 pontos vistos pelos três tipos de aprendizado">
        {mode !== 'ref' && <Grid w={W} h={H} step={46} />}

        {mode === 'sup' && (
          <>
            {BOUNDARY.length === 2 && (
              <line
                x1={toPx(BOUNDARY[0][0])}
                y1={toPy(BOUNDARY[0][1])}
                x2={toPx(BOUNDARY[1][0])}
                y2={toPy(BOUNDARY[1][1])}
                stroke={VIZ.a}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            )}
            {DATA.map((s, i) => (
              <circle
                key={i}
                cx={toPx(s.x)}
                cy={toPy(s.y)}
                r={5}
                fill={s.label === 1 ? VIZ.d : VIZ.e}
                opacity={0.9}
              />
            ))}
          </>
        )}

        {mode === 'nsup' && (
          <>
            {DATA.map((s, i) => (
              <circle
                key={i}
                cx={toPx(s.x)}
                cy={toPy(s.y)}
                r={5}
                fill={SERIES[KM.assign[i] % SERIES.length]}
                opacity={0.85}
              />
            ))}
            {KM.centroids.map((c, j) => (
              <g key={j}>
                <circle
                  cx={toPx(c.x)}
                  cy={toPy(c.y)}
                  r={10}
                  fill="none"
                  stroke={VIZ.ink}
                  strokeWidth={2}
                />
                <circle cx={toPx(c.x)} cy={toPy(c.y)} r={2.5} fill={VIZ.ink} />
              </g>
            ))}
          </>
        )}

        {mode === 'ref' && (
          <>
            {DATA.map((s, i) => (
              <circle key={i} cx={toPx(s.x)} cy={toPy(s.y)} r={4} fill={VIZ.muted} opacity={0.15} />
            ))}
            {Array.from({ length: GRID + 1 }, (_, i) => (
              <g key={i}>
                <line
                  x1={X0 + i * CELL}
                  y1={PAD}
                  x2={X0 + i * CELL}
                  y2={H - PAD}
                  stroke={VIZ.grid}
                  strokeWidth={1}
                />
                <line
                  x1={X0}
                  y1={PAD + i * CELL}
                  x2={X0 + CELL * GRID}
                  y2={PAD + i * CELL}
                  stroke={VIZ.grid}
                  strokeWidth={1}
                />
              </g>
            ))}
            <rect
              x={X0 + (GRID - 1) * CELL + 3}
              y={PAD + 3}
              width={CELL - 6}
              height={CELL - 6}
              rx={5}
              fill={VIZ.d}
              opacity={0.35}
            />
            {episodes.slice(-4, -1).map((ep, k) => (
              <polyline
                key={k}
                points={ep.path.map(([i, j]) => `${cellX(i)},${cellY(j)}`).join(' ')}
                fill="none"
                stroke={VIZ.a}
                strokeWidth={1.5}
                opacity={0.12 + 0.08 * k}
              />
            ))}
            <polyline
              points={current.path
                .slice(0, step + 1)
                .map(([i, j]) => `${cellX(i)},${cellY(j)}`)
                .join(' ')}
              fill="none"
              stroke={VIZ.a}
              strokeWidth={2.5}
              strokeLinejoin="round"
              opacity={0.9}
            />
            <circle
              cx={cellX(head[0])}
              cy={cellY(head[1])}
              r={7}
              fill={VIZ.a}
              stroke={VIZ.surface}
              strokeWidth={2}
            />
          </>
        )}
      </Plot>

      <Panel title="o que muda entre os três">
        <div className="flex flex-col gap-1 text-sm">
          <div>
            <span className="text-faint">você dá: </span>
            <span className="text-ink">{txt[0]}</span>
          </div>
          <div>
            <span className="text-faint">ele devolve: </span>
            <span className="text-ink">{txt[1]}</span>
          </div>
          <div>
            <span className="text-faint">no mundo real: </span>
            <span className="text-ink">{txt[2]}</span>
          </div>
        </div>
      </Panel>

      {mode === 'sup' && (
        <Stats>
          <Stat label="pontos" value={DATA.length} />
          <Stat label="classes" value={2} />
          <Stat label="rótulos dados" value={DATA.length} />
          <Stat
            label="acurácia"
            value={`${Math.round(ACC * 100)}%`}
            tone={ACC === 1 ? 'emerald' : 'amber'}
          />
        </Stats>
      )}
      {mode === 'nsup' && (
        <Stats>
          <Stat label="pontos" value={DATA.length} />
          <Stat label="rótulos dados" value={0} />
          <Stat label="grupos achados" value={3} tone="accent" />
          <Stat
            label="maior grupo"
            value={Math.max(...[0, 1, 2].map((j) => KM.assign.filter((a) => a === j).length))}
          />
        </Stats>
      )}
      {mode === 'ref' && (
        <Stats>
          <Stat label="episódio" value={count} />
          <Stat label="passos" value={current.path.length - 1} />
          <Stat
            label="recompensa"
            value={fmt(current.reward, 1)}
            tone={current.reward > 0 ? 'emerald' : 'rose'}
          />
          <Stat label="exploração ε" value={fmt(current.eps, 2)} tone="amber" />
        </Stats>
      )}

      {mode === 'sup' && (
        <Legend
          items={[
            { color: VIZ.d, label: 'rótulo positivo' },
            { color: VIZ.e, label: 'rótulo negativo' },
            { color: VIZ.a, label: 'fronteira aprendida' },
          ]}
        />
      )}
      {mode === 'nsup' && (
        <Legend items={[0, 1, 2].map((j) => ({ color: SERIES[j], label: `grupo ${j + 1}` }))} />
      )}
      {mode === 'ref' && (
        <Legend
          items={[
            { color: VIZ.a, label: 'agente e rastro' },
            { color: VIZ.d, label: 'recompensa' },
          ]}
        />
      )}

      <Caption>
        Os 50 pontos são exatamente os mesmos nos três modos — o que muda é a pergunta e o que você
        entrega ao algoritmo: rótulos, nada, ou recompensas. No modo por reforço, aperte “Novo
        episódio”: com ε caindo o caminho encurta a cada tentativa, mas explore demais no início e o
        agente nem chega na recompensa — é o preço de aprender sem ninguém dizendo a resposta.
      </Caption>
    </div>
  )
}
