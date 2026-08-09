import { useCallback, useMemo, useRef, useState } from 'react'
import {
  Btn,
  Caption,
  Choice,
  Controls,
  Grid,
  Legend,
  Plot,
  Row,
  Slider,
  Stat,
  Stats,
  VIZ,
} from '../components/ui'
import { useInterval } from '../lib/hooks'
import { fmt, gaussian, rng } from '../lib/mathx'

/* One neuron learning a linear boundary with the classic perceptron rule.
   AND and OR converge in a few passes; XOR never does — which is the whole
   historical point of this page. */

const W = 520
const H = 320
const PAD = 34
const LO = -0.35
const HI = 1.35

type Sample = { x: number; y: number; label: 1 | -1 }
type SetName = 'and' | 'or' | 'xor' | 'nuvens'

const toPx = (x: number) => PAD + ((x - LO) / (HI - LO)) * (W - 2 * PAD)
const toPy = (y: number) => H - PAD - ((y - LO) / (HI - LO)) * (H - 2 * PAD)

function makeData(name: SetName): Sample[] {
  if (name === 'nuvens') {
    const next = rng(7)
    const out: Sample[] = []
    for (let i = 0; i < 40; i++) {
      out.push({ x: gaussian(next, 0.28, 0.13), y: gaussian(next, 0.32, 0.13), label: -1 })
      out.push({ x: gaussian(next, 0.78, 0.13), y: gaussian(next, 0.72, 0.13), label: 1 })
    }
    return out
  }
  const corners: [number, number][] = [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ]
  const rule = (a: number, b: number): 1 | -1 => {
    if (name === 'and') return a === 1 && b === 1 ? 1 : -1
    if (name === 'or') return a === 1 || b === 1 ? 1 : -1
    return a !== b ? 1 : -1 // xor
  }
  return corners.map(([a, b]) => ({ x: a, y: b, label: rule(a, b) }))
}

type Weights = { w1: number; w2: number; b: number }
const INITIAL: Weights = { w1: 0.45, w2: -0.6, b: -0.1 }

export default function PerceptronDemo() {
  const [set, setSet] = useState<SetName>('and')
  const [lr, setLr] = useState(0.1)
  const [w, setW] = useState<Weights>(INITIAL)
  const [steps, setSteps] = useState(0)
  const [running, setRunning] = useState(false)
  const [lastIdx, setLastIdx] = useState<number | null>(null)
  const cursor = useRef(0)

  const data = useMemo(() => makeData(set), [set])

  const predict = useCallback(
    (s: Sample, weights: Weights) =>
      weights.w1 * s.x + weights.w2 * s.y + weights.b >= 0 ? 1 : -1,
    [],
  )

  const wrong = useMemo(
    () => data.map((s, i) => (predict(s, w) !== s.label ? i : -1)).filter((i) => i >= 0),
    [data, w, predict],
  )

  const reset = useCallback((nextSet?: SetName) => {
    setRunning(false)
    setW(INITIAL)
    setSteps(0)
    setLastIdx(null)
    cursor.current = 0
    if (nextSet) setSet(nextSet)
  }, [])

  /** One perceptron update: walk to the next misclassified point and nudge. */
  const step = useCallback(() => {
    setW((prev) => {
      for (let n = 0; n < data.length; n++) {
        const i = (cursor.current + n) % data.length
        const s = data[i]
        if (predict(s, prev) !== s.label) {
          cursor.current = (i + 1) % data.length
          setLastIdx(i)
          setSteps((k) => k + 1)
          return {
            w1: prev.w1 + lr * s.label * s.x,
            w2: prev.w2 + lr * s.label * s.y,
            b: prev.b + lr * s.label,
          }
        }
      }
      setRunning(false)
      setLastIdx(null)
      return prev
    })
  }, [data, lr, predict])

  useInterval(step, 260, running)

  // decision boundary: w1·x + w2·y + b = 0
  const line = useMemo(() => {
    const pts: [number, number][] = []
    if (Math.abs(w.w2) > 1e-6) {
      pts.push([LO, -(w.w1 * LO + w.b) / w.w2])
      pts.push([HI, -(w.w1 * HI + w.b) / w.w2])
    } else if (Math.abs(w.w1) > 1e-6) {
      const x = -w.b / w.w1
      pts.push([x, LO], [x, HI])
    }
    return pts
  }, [w])

  const accuracy = (data.length - wrong.length) / data.length

  return (
    <div className="flex flex-col gap-4">
      <Row>
        <Choice
          value={set}
          onChange={(v) => reset(v)}
          options={[
            { value: 'and', label: 'AND' },
            { value: 'or', label: 'OR' },
            { value: 'xor', label: 'XOR', title: 'Um único neurônio não resolve — veja acontecer' },
            { value: 'nuvens', label: 'Duas nuvens' },
          ]}
        />
        <span className="ml-auto" />
        <Btn onClick={() => setRunning((v) => !v)} variant="primary">
          {running ? 'Pausar' : 'Treinar'}
        </Btn>
        <Btn onClick={step} disabled={running}>
          Um passo
        </Btn>
        <Btn onClick={() => reset()} variant="danger">
          Zerar
        </Btn>
      </Row>

      <Plot w={W} h={H} aria-label="Espaço de entrada com a fronteira de decisão do perceptron">
        <Grid w={W} h={H} step={48} />

        {/* half-plane tint */}
        {line.length === 2 && (
          <>
            <defs>
              <clipPath id="perc-clip">
                <rect x={PAD} y={PAD} width={W - 2 * PAD} height={H - 2 * PAD} />
              </clipPath>
            </defs>
            <g clipPath="url(#perc-clip)">
              <polygon
                points={[
                  `${toPx(line[0][0])},${toPy(line[0][1])}`,
                  `${toPx(line[1][0])},${toPy(line[1][1])}`,
                  `${toPx(HI)},${toPy(w.w2 >= 0 ? HI : LO)}`,
                  `${toPx(LO)},${toPy(w.w2 >= 0 ? HI : LO)}`,
                ].join(' ')}
                fill={VIZ.a}
                opacity={0.07}
              />
              <line
                x1={toPx(line[0][0])}
                y1={toPy(line[0][1])}
                x2={toPx(line[1][0])}
                y2={toPy(line[1][1])}
                stroke={VIZ.a}
                strokeWidth={2.5}
                strokeLinecap="round"
                style={{ transition: 'all 180ms linear' }}
              />
            </g>
          </>
        )}

        {/* axes */}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke={VIZ.axis} strokeWidth={1} />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke={VIZ.axis} strokeWidth={1} />
        <text x={W - PAD} y={H - PAD + 18} fill={VIZ.axis} fontSize={11} textAnchor="end">
          entrada x₁
        </text>
        <text x={PAD - 8} y={PAD + 4} fill={VIZ.axis} fontSize={11} textAnchor="end">
          x₂
        </text>

        {data.map((s, i) => {
          const bad = wrong.includes(i)
          const color = s.label === 1 ? VIZ.d : VIZ.e
          return (
            <g key={i}>
              {i === lastIdx && (
                <circle
                  cx={toPx(s.x)}
                  cy={toPy(s.y)}
                  r={13}
                  fill="none"
                  stroke={VIZ.c}
                  strokeWidth={1.5}
                />
              )}
              <circle
                cx={toPx(s.x)}
                cy={toPy(s.y)}
                r={set === 'nuvens' ? 4.5 : 8}
                fill={bad ? 'none' : color}
                stroke={color}
                strokeWidth={2}
                opacity={bad ? 1 : 0.9}
              />
            </g>
          )
        })}
      </Plot>

      <Controls cols={1}>
        <Slider
          label="learning rate"
          value={lr}
          onChange={setLr}
          min={0.01}
          max={0.6}
          step={0.01}
          format={(v) => v.toFixed(2)}
          hint="Passo de cada correção. Alto demais faz a reta pular de um lado pro outro."
        />
      </Controls>

      <Stats>
        <Stat label="correções" value={steps} />
        <Stat
          label="acertos"
          value={`${Math.round(accuracy * 100)}%`}
          tone={accuracy === 1 ? 'emerald' : 'amber'}
        />
        <Stat label="pesos" value={`${fmt(w.w1)} · ${fmt(w.w2)}`} />
        <Stat label="viés" value={fmt(w.b)} />
      </Stats>

      <Legend
        items={[
          { color: VIZ.d, label: 'classe +1' },
          { color: VIZ.e, label: 'classe −1' },
          { color: VIZ.a, label: 'fronteira de decisão' },
        ]}
      />

      <Caption>
        Círculo vazado = ponto que o neurônio ainda erra. O anel amarelo marca o exemplo usado na
        última correção. Em XOR nenhuma reta separa os quatro cantos, então as correções nunca param
        — foi esse resultado que congelou a pesquisa em redes neurais nos anos 70.
      </Caption>
    </div>
  )
}
