import { useMemo, useState } from 'react'
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
import { gaussian, rng } from '../lib/mathx'

const W = 520
const H = 320
type DatasetName = 'círculos' | 'luas' | 'espiral' | 'xor'
type Activation = 'relu' | 'tanh' | 'sigmoid'
type Point = { x: number; y: number; label: number }
type Net = { weights: number[][][]; biases: number[][] }
type TrainState = {
  net: Net
  displayNet: Net
  epoch: number
  displayEpoch: number
  history: number[]
}

function makeData(name: DatasetName): Point[] {
  const next = rng(101)
  if (name === 'círculos')
    return Array.from({ length: 200 }, (_, i) => {
      const label = i % 2
      const a = next() * Math.PI * 2
      const r = (label ? 0.78 : 0.33) + gaussian(next, 0, 0.06)
      return { x: Math.cos(a) * r, y: Math.sin(a) * r, label }
    })
  if (name === 'luas')
    return Array.from({ length: 200 }, (_, i) => {
      const label = i % 2
      const a = next() * Math.PI
      const nx = gaussian(next, 0, 0.055)
      const ny = gaussian(next, 0, 0.055)
      return label
        ? {
            x: (0.45 - Math.cos(a) * 0.75) / 1.25 + nx,
            y: (-Math.sin(a) * 0.72 + 0.35) / 1.15 + ny,
            label,
          }
        : {
            x: (Math.cos(a) * 0.75 - 0.22) / 1.25 + nx,
            y: (Math.sin(a) * 0.72 - 0.2) / 1.15 + ny,
            label,
          }
    })
  if (name === 'espiral')
    return Array.from({ length: 200 }, (_, i) => {
      const label = i % 2
      const r = 0.12 + 0.78 * next()
      const a = r * Math.PI * 3 + label * Math.PI + gaussian(next, 0, 0.13)
      return { x: Math.cos(a) * r, y: Math.sin(a) * r, label }
    })
  return Array.from({ length: 200 }, () => {
    const x = next() * 2 - 1
    const y = next() * 2 - 1
    return { x, y, label: x * y > 0 ? 1 : 0 }
  })
}

function createNet(layers: number, neurons: number): Net {
  const next = rng(227 + layers * 19 + neurons)
  const sizes = [2, ...Array(layers).fill(neurons), 1]
  return {
    weights: sizes
      .slice(1)
      .map((out, l) =>
        Array.from({ length: out }, () =>
          Array.from({ length: sizes[l] }, () => gaussian(next, 0, Math.sqrt(1.4 / sizes[l]))),
        ),
      ),
    biases: sizes.slice(1).map((n) => Array<number>(n).fill(0)),
  }
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, x))))
const activate = (x: number, kind: Activation) =>
  kind === 'relu' ? Math.max(0, x) : kind === 'tanh' ? Math.tanh(x) : sigmoid(x)
const derivative = (z: number, a: number, kind: Activation) =>
  kind === 'relu' ? (z > 0 ? 1 : 0) : kind === 'tanh' ? 1 - a * a : a * (1 - a)

function forward(net: Net, point: Point | { x: number; y: number }, kind: Activation) {
  const activations: number[][] = [[point.x, point.y]]
  const zs: number[][] = []
  net.weights.forEach((matrix, l) => {
    const z = matrix.map((row, j) =>
      row.reduce((s, w, i) => s + w * activations[l][i], net.biases[l][j]),
    )
    zs.push(z)
    activations.push(z.map((v) => (l === net.weights.length - 1 ? sigmoid(v) : activate(v, kind))))
  })
  return { activations, zs, output: activations.at(-1)?.[0] ?? 0 }
}

function trainOne(net: Net, data: Point[], kind: Activation, lr: number): Net {
  const gw = net.weights.map((m) => m.map((row) => row.map(() => 0)))
  const gb = net.biases.map((layer) => layer.map(() => 0))
  data.forEach((point) => {
    const cache = forward(net, point, kind)
    let delta = [cache.output - point.label]
    for (let l = net.weights.length - 1; l >= 0; l--) {
      delta.forEach((d, j) => {
        gb[l][j] += d
        cache.activations[l].forEach((a, i) => {
          gw[l][j][i] += d * a
        })
      })
      if (l > 0)
        delta = cache.activations[l].map(
          (a, i) =>
            net.weights[l].reduce((s, row, j) => s + row[i] * delta[j], 0) *
            derivative(cache.zs[l - 1][i], a, kind),
        )
    }
  })
  const scale = lr / data.length
  return {
    weights: net.weights.map((m, l) =>
      m.map((row, j) => row.map((w, i) => w - scale * gw[l][j][i])),
    ),
    biases: net.biases.map((layer, l) => layer.map((b, j) => b - scale * gb[l][j])),
  }
}

function metrics(net: Net, data: Point[], kind: Activation) {
  let loss = 0
  let correct = 0
  data.forEach((p) => {
    const y = forward(net, p, kind).output
    loss += -(p.label * Math.log(y + 1e-7) + (1 - p.label) * Math.log(1 - y + 1e-7))
    correct += (y >= 0.5 ? 1 : 0) === p.label ? 1 : 0
  })
  return { loss: loss / data.length, accuracy: correct / data.length }
}

export default function MlpPlaygroundDemo() {
  const [datasetName, setDatasetName] = useState<DatasetName>('círculos')
  const [layers, setLayers] = useState(1)
  const [neurons, setNeurons] = useState(6)
  const [activation, setActivation] = useState<Activation>('tanh')
  const [lr, setLr] = useState(0.12)
  const [running, setRunning] = useState(false)
  const data = useMemo(() => makeData(datasetName), [datasetName])
  const fresh = () => {
    const net = createNet(layers, neurons)
    return { net, displayNet: net, epoch: 0, displayEpoch: 0, history: [] }
  }
  const [state, setState] = useState<TrainState>(() => fresh())
  const reset = (nextLayers = layers, nextNeurons = neurons) => {
    const net = createNet(nextLayers, nextNeurons)
    setRunning(false)
    setState({ net, displayNet: net, epoch: 0, displayEpoch: 0, history: [] })
  }
  const advance = (count: number) =>
    setState((s) => {
      let net = s.net
      for (let i = 0; i < count; i++) net = trainOne(net, data, activation, lr)
      const epoch = s.epoch + count
      const loss = metrics(net, data, activation).loss
      const refresh = epoch - s.displayEpoch >= 8
      return {
        net,
        displayNet: refresh ? net : s.displayNet,
        epoch,
        displayEpoch: refresh ? epoch : s.displayEpoch,
        history: [...s.history.slice(-99), loss],
      }
    })
  useInterval(() => advance(20), 110, running)
  const report = metrics(state.net, data, activation)
  const grid = useMemo(
    () =>
      Array.from({ length: 40 * 26 }, (_, i) => {
        const col = i % 40
        const row = Math.floor(i / 40)
        const x = -1.1 + ((col + 0.5) * 2.2) / 40
        const y = 1.1 - ((row + 0.5) * 2.2) / 26
        return { col, row, value: forward(state.displayNet, { x, y }, activation).output }
      }),
    [activation, state.displayNet],
  )
  const maxLoss = Math.max(0.7, ...state.history)
  const lossLine = state.history
    .map(
      (v, i) =>
        `${25 + (i * 470) / Math.max(1, state.history.length - 1)},${H - 25 - (Math.min(v, maxLoss) / maxLoss) * (H - 50)}`,
    )
    .join(' ')
  const params =
    state.net.weights.reduce((s, m) => s + m.reduce((r, row) => r + row.length, 0), 0) +
    state.net.biases.reduce((s, b) => s + b.length, 0)

  return (
    <div className="flex flex-col gap-4">
      <Row>
        <Choice
          value={datasetName}
          onChange={(v) => {
            setDatasetName(v)
            setRunning(false)
            setState(fresh())
          }}
          options={[
            { value: 'círculos', label: 'Círculos' },
            { value: 'luas', label: 'Duas luas' },
            { value: 'espiral', label: 'Espiral' },
            { value: 'xor', label: 'XOR' },
          ]}
        />
        <Btn onClick={() => setRunning((v) => !v)} variant="primary">
          {running ? 'Pausar' : 'Treinar'}
        </Btn>
        <Btn onClick={() => advance(1)} disabled={running}>
          Um passo
        </Btn>
        <Btn onClick={() => reset()} variant="danger">
          Reiniciar pesos
        </Btn>
      </Row>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Plot w={W} h={H} aria-label="Fronteira aprendida pela MLP">
          {grid.map((g) => (
            <rect
              key={`${g.col}-${g.row}`}
              x={(g.col * W) / 40}
              y={(g.row * H) / 26}
              width={W / 40 + 0.5}
              height={H / 26 + 0.5}
              fill={g.value >= 0.5 ? VIZ.c : VIZ.f}
              opacity={0.08 + Math.abs(g.value - 0.5) * 0.55}
            />
          ))}
          {data.map((p, i) => (
            <circle
              key={i}
              cx={((p.x + 1.1) / 2.2) * W}
              cy={((1.1 - p.y) / 2.2) * H}
              r={3.5}
              fill={p.label ? VIZ.c : VIZ.f}
              stroke={VIZ.surface}
              strokeWidth={1}
            />
          ))}
        </Plot>
        <Plot w={W} h={H} aria-label="Curva da perda ao longo das épocas">
          <polyline points={lossLine} fill="none" stroke={VIZ.a} strokeWidth={2.5} />
          <line x1={25} y1={H - 25} x2={W - 25} y2={H - 25} stroke={VIZ.axis} />
        </Plot>
      </div>
      <Controls cols={3}>
        <Slider
          label="camadas ocultas"
          value={layers}
          onChange={(v) => {
            setLayers(v)
            reset(v, neurons)
          }}
          min={1}
          max={3}
        />
        <Slider
          label="neurônios por camada"
          value={neurons}
          onChange={(v) => {
            setNeurons(v)
            reset(layers, v)
          }}
          min={1}
          max={8}
        />
        <Choice
          label="ativação"
          value={activation}
          onChange={(v) => {
            setActivation(v)
            reset()
          }}
          options={[
            { value: 'relu', label: 'ReLU' },
            { value: 'tanh', label: 'tanh' },
            { value: 'sigmoid', label: 'sigmoid' },
          ]}
        />
        <Slider
          label="learning rate"
          value={lr}
          onChange={setLr}
          min={0.005}
          max={0.5}
          step={0.005}
          format={(v) => v.toFixed(3)}
        />
      </Controls>
      <Stats>
        <Stat label="época" value={state.epoch} />
        <Stat label="perda" value={report.loss.toFixed(4)} tone="accent" />
        <Stat
          label="acurácia"
          value={`${Math.round(report.accuracy * 100)}%`}
          tone={report.accuracy > 0.9 ? 'emerald' : 'amber'}
        />
        <Stat label="parâmetros" value={params} />
      </Stats>
      <Caption>
        Círculos e luas convergem com uma camada de seis neurônios. A espiral exige compor curvas:
        aumente para duas camadas. Se poucos neurônios falham mesmo após muitas épocas, o limite é
        capacidade, não tempo de treino.
      </Caption>
    </div>
  )
}
