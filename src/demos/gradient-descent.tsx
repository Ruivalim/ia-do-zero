import { useCallback, useMemo, useState } from 'react'
import {
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
import { clamp, rng } from '../lib/mathx'

const W = 520
const H = 300
type Mode = '1d' | '2d'
type State = {
  x: number
  y: number
  vx: number
  vy: number
  step: number
  trail: [number, number][]
}
const loss1 = (x: number) => 0.22 * (x * x - 1.5) ** 2 + 0.18 * x + 0.25
const grad1 = (x: number) => 0.88 * x * (x * x - 1.5) + 0.18
const loss2 = (x: number, y: number) => 0.18 * (x + y) ** 2 + 3.8 * (x - y) ** 2
const grad2 = (x: number, y: number): [number, number] => [
  0.36 * (x + y) + 7.6 * (x - y),
  0.36 * (x + y) - 7.6 * (x - y),
]
const INITIAL: State = { x: 1.75, y: -1.25, vx: 0, vy: 0, step: 0, trail: [] }

export default function GradientDescentDemo() {
  const [mode, setMode] = useState<Mode>('2d')
  const [lr, setLr] = useState(0.08)
  const [momentum, setMomentum] = useState(0.2)
  const [state, setState] = useState<State>(INITIAL)
  const [running, setRunning] = useState(false)
  const [drops, setDrops] = useState(0)
  const gradient = mode === '1d' ? [grad1(state.x), 0] : grad2(state.x, state.y)
  const loss = mode === '1d' ? loss1(state.x) : loss2(state.x, state.y)

  const step = useCallback(() => {
    setState((s) => {
      const [gx, gy] = mode === '1d' ? [grad1(s.x), 0] : grad2(s.x, s.y)
      const vx = clamp(momentum * s.vx - lr * gx, -1e6, 1e6)
      const vy = clamp(momentum * s.vy - lr * gy, -1e6, 1e6)
      return {
        x: clamp(s.x + vx, -1e6, 1e6),
        y: mode === '1d' ? 0 : clamp(s.y + vy, -1e6, 1e6),
        vx,
        vy,
        step: s.step + 1,
        trail: [...s.trail.slice(-49), [s.x, s.y]],
      }
    })
  }, [lr, mode, momentum])
  useInterval(step, 120, running)
  const drop = () => {
    const next = rng(71 + drops)
    setDrops((n) => n + 1)
    setRunning(false)
    setState({
      x: -2.2 + next() * 4.4,
      y: mode === '1d' ? 0 : -2 + next() * 4,
      vx: 0,
      vy: 0,
      step: 0,
      trail: [],
    })
  }
  const curve = useMemo(
    () =>
      Array.from({ length: 161 }, (_, i) => {
        const x = -2.4 + (i * 4.8) / 160
        return `${30 + (i * 460) / 160},${260 - (Math.min(3.2, loss1(x)) / 3.2) * 220}`
      }).join(' '),
    [],
  )
  const px1 = (x: number) => 30 + ((clamp(x, -2.4, 2.4) + 2.4) / 4.8) * 460
  const py1 = (v: number) => 260 - (Math.min(3.2, Math.max(0, v)) / 3.2) * 220
  const px2 = (x: number) => 30 + ((clamp(x, -2.4, 2.4) + 2.4) / 4.8) * 460
  const py2 = (y: number) => 270 - ((clamp(y, -2.1, 2.1) + 2.1) / 4.2) * 240

  return (
    <div className="flex flex-col gap-4">
      <Row>
        <Choice
          value={mode}
          onChange={(v) => {
            setMode(v)
            setRunning(false)
            setState({ ...INITIAL, y: v === '1d' ? 0 : INITIAL.y })
          }}
          options={[
            { value: '1d', label: '1D' },
            { value: '2d', label: '2D' },
          ]}
        />
        <Btn onClick={() => setRunning((v) => !v)} variant="primary">
          {running ? 'Pausar' : 'Rodar'}
        </Btn>
        <Btn onClick={step} disabled={running}>
          Um passo
        </Btn>
        <Btn onClick={drop}>Soltar em posição aleatória</Btn>
      </Row>
      <Plot
        w={W}
        h={H}
        aria-label={
          mode === '1d'
            ? 'Curva de perda e passo do gradiente'
            : 'Mapa de contorno e trajetória do gradiente'
        }
      >
        {mode === '1d' ? (
          <>
            <polyline points={curve} fill="none" stroke={VIZ.a} strokeWidth={2.5} />
            <line
              x1={px1(state.x - 0.45)}
              y1={py1(loss + gradient[0] * -0.45)}
              x2={px1(state.x + 0.45)}
              y2={py1(loss + gradient[0] * 0.45)}
              stroke={VIZ.c}
              strokeWidth={2}
            />
            <line
              x1={px1(state.x)}
              y1={py1(loss) - 14}
              x2={px1(state.x + state.vx)}
              y2={py1(loss) - 14}
              stroke={VIZ.e}
              strokeWidth={3}
              markerEnd="url(#gd-arrow)"
            />
            <circle cx={px1(state.x)} cy={py1(loss)} r={8} fill={VIZ.b} />
          </>
        ) : (
          <>
            <g transform="translate(260 150) rotate(45)">
              {[0.15, 0.3, 0.55, 0.9, 1.35, 1.9, 2.6, 3.4, 4.5, 6].map((level) => (
                <ellipse
                  key={level}
                  cx={0}
                  cy={0}
                  rx={Math.sqrt(level / 0.18) * 54}
                  ry={Math.sqrt(level / 3.8) * 54}
                  fill="none"
                  stroke={VIZ.grid}
                  strokeWidth={1.3}
                />
              ))}
            </g>
            <polyline
              points={state.trail.map(([x, y]) => `${px2(x)},${py2(y)}`).join(' ')}
              fill="none"
              stroke={VIZ.c}
              strokeWidth={2}
            />
            <circle
              cx={px2(state.x)}
              cy={py2(state.y)}
              r={8}
              fill={Math.abs(state.x) > 2.4 || Math.abs(state.y) > 2.1 ? VIZ.e : VIZ.b}
            />
          </>
        )}
        <defs>
          <marker id="gd-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L7,3 z" fill={VIZ.e} />
          </marker>
        </defs>
      </Plot>
      <Controls>
        <Slider
          label="learning rate"
          value={lr}
          onChange={setLr}
          min={0.001}
          max={1.2}
          step={0.001}
          format={(v) => v.toFixed(3)}
        />
        <Slider
          label="momentum"
          value={momentum}
          onChange={setMomentum}
          min={0}
          max={0.95}
          step={0.05}
          format={(v) => v.toFixed(2)}
        />
      </Controls>
      <Stats>
        <Stat
          label="perda"
          value={loss > 1e9 ? 'divergiu' : loss.toFixed(4)}
          tone={loss > 20 ? 'rose' : 'accent'}
        />
        <Stat label="norma do gradiente" value={Math.hypot(...gradient).toFixed(3)} />
        <Stat label="passo" value={state.step} />
      </Stats>
      <Caption>
        Learning rate baixo mal move a bolinha. Alto demais atravessa o vale, oscila e sobe a
        parede; momentum pode acelerar no eixo longo, mas também amplifica esse excesso.
      </Caption>
    </div>
  )
}
