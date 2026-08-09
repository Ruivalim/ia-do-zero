import { useCallback, useMemo, useState } from 'react'
import { Btn, Caption, Controls, Grid, Plot, Row, Slider, Stat, Stats, VIZ } from '../components/ui'
import { useInterval } from '../lib/hooks'
import { fmt, gaussian, mean, rng } from '../lib/mathx'

const W = 520
const H = 300
const PAD = 34

type Point = { x: number; y: number }
type Model = { a: number; b: number }

function makeData(noise: number): Point[] {
  const next = rng(3)
  return Array.from({ length: 24 }, (_, i) => {
    const x = -1 + (2 * i) / 23
    return { x, y: 0.72 * x + 0.14 + gaussian(next, 0, noise) }
  })
}

const sx = (x: number) => PAD + ((x + 1.1) / 2.2) * (W - 2 * PAD)
const sy = (y: number) => H - PAD - ((y + 1.25) / 2.5) * (H - 2 * PAD)

export default function LinearRegressionDemo() {
  const [noise, setNoise] = useState(0.18)
  const [lr, setLr] = useState(0.08)
  const [model, setModel] = useState<Model>({ a: -0.45, b: 0.65 })
  const [steps, setSteps] = useState(0)
  const [running, setRunning] = useState(false)
  const data = useMemo(() => makeData(noise), [noise])

  const currentMse = useMemo(
    () => mean(data.map((p) => (model.a * p.x + model.b - p.y) ** 2)),
    [data, model],
  )

  const step = useCallback(() => {
    setModel((m) => {
      const da = (2 / data.length) * data.reduce((s, p) => s + (m.a * p.x + m.b - p.y) * p.x, 0)
      const db = (2 / data.length) * data.reduce((s, p) => s + m.a * p.x + m.b - p.y, 0)
      const next = { a: m.a - lr * 4 * da, b: m.b - lr * 4 * db }
      return Math.abs(next.a) > 1e5 || Math.abs(next.b) > 1e5
        ? { a: Math.sign(next.a) * 1e5, b: Math.sign(next.b) * 1e5 }
        : next
    })
    setSteps((n) => n + 1)
  }, [data, lr])

  useInterval(step, 90, running)

  const reset = () => {
    setRunning(false)
    setModel({ a: -0.45, b: 0.65 })
    setSteps(0)
  }

  return (
    <div className="flex flex-col gap-4">
      <Row>
        <Btn onClick={() => setRunning((v) => !v)} variant="primary">
          {running ? 'Pausar' : 'Treinar'}
        </Btn>
        <Btn onClick={step} disabled={running}>
          Um passo
        </Btn>
        <Btn onClick={reset} variant="danger">
          Zerar
        </Btn>
      </Row>

      <Plot w={W} h={H} aria-label="Pontos, reta da regressão e resíduos verticais">
        <Grid w={W} h={H} step={46} />
        {data.map((p, i) => {
          const py = model.a * p.x + model.b
          return (
            <g key={i}>
              <line
                x1={sx(p.x)}
                y1={sy(p.y)}
                x2={sx(p.x)}
                y2={sy(py)}
                stroke={VIZ.e}
                strokeDasharray="3 3"
                opacity={0.65}
              />
              <circle cx={sx(p.x)} cy={sy(p.y)} r={4} fill={VIZ.b} />
            </g>
          )
        })}
        <line
          x1={sx(-1.1)}
          y1={sy(model.a * -1.1 + model.b)}
          x2={sx(1.1)}
          y2={sy(model.a * 1.1 + model.b)}
          stroke={VIZ.a}
          strokeWidth={3}
        />
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke={VIZ.axis} />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke={VIZ.axis} />
      </Plot>

      <Controls>
        <Slider
          label="learning rate"
          value={Math.log10(lr)}
          onChange={(v) => setLr(10 ** v)}
          min={-3}
          max={Math.log10(0.3)}
          step={0.01}
          format={(v) => (10 ** v).toFixed(3)}
        />
        <Slider
          label="ruído"
          value={noise}
          onChange={(v) => {
            setNoise(v)
            reset()
          }}
          min={0}
          max={0.55}
          step={0.01}
          format={(v) => v.toFixed(2)}
        />
      </Controls>
      <Stats>
        <Stat
          label="MSE"
          value={fmt(currentMse, 4)}
          tone={currentMse < 0.06 ? 'emerald' : 'amber'}
        />
        <Stat label="inclinação a" value={fmt(model.a, 3)} />
        <Stat label="intercepto b" value={fmt(model.b, 3)} />
        <Stat label="passos" value={steps} />
      </Stats>
      <Caption>
        Os resíduos tracejados encolhem junto com o MSE. Nos primeiros passos a reta corrige os
        maiores erros; depois, o ganho quase some. Learning rate alto demais faz a solução oscilar
        ou divergir.
      </Caption>
    </div>
  )
}
