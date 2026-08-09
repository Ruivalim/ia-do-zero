import { useMemo, useState } from 'react'
import { Btn, Caption, Controls, Plot, Row, Slider, Stat, Stats, VIZ } from '../components/ui'
import { useInterval } from '../lib/hooks'

const W = 620
const H = 300
const SHAPE = [2, 3, 2, 1]
type Network = { weights: number[][][]; biases: number[][] }
type Animation = { kind: 'forward' | 'backward'; layer: number } | null

const INITIAL: Network = {
  weights: [
    [
      [0.45, -0.3],
      [-0.22, 0.38],
      [0.3, 0.16],
    ],
    [
      [0.28, -0.34, 0.19],
      [-0.41, 0.21, 0.27],
    ],
    [[0.52, -0.37]],
  ],
  biases: [[0.05, -0.08, 0.02], [0.04, -0.03], [0.1]],
}
const INPUT = [0.8, -0.45]
const TARGET = 0.82
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))

function inspect(net: Network) {
  const activations: number[][] = [INPUT]
  net.weights.forEach((matrix, l) => {
    const prev = activations[l]
    activations.push(
      matrix.map((row, j) => {
        const z = row.reduce((s, w, i) => s + w * prev[i], net.biases[l][j])
        return l === net.weights.length - 1 ? sigmoid(z) : Math.tanh(z)
      }),
    )
  })
  const deltas: number[][] = Array.from({ length: 3 }, () => [])
  const output = activations[3][0]
  deltas[2] = [(output - TARGET) * output * (1 - output)]
  for (let l = 1; l >= 0; l--) {
    deltas[l] = activations[l + 1].map((a, i) => {
      const back = deltas[l + 1].reduce((s, d, j) => s + net.weights[l + 1][j][i] * d, 0)
      return back * (1 - a * a)
    })
  }
  const gradients = net.weights.map((matrix, l) =>
    matrix.map((row, j) => row.map((_, i) => deltas[l][j] * activations[l][i])),
  )
  return { activations, deltas, gradients, output, loss: 0.5 * (output - TARGET) ** 2 }
}

export default function BackpropDemo() {
  const [network, setNetwork] = useState<Network>(INITIAL)
  const [lr, setLr] = useState(0.35)
  const [animation, setAnimation] = useState<Animation>(null)
  const info = useMemo(() => inspect(network), [network])
  const positions = SHAPE.map((count, l) =>
    Array.from({ length: count }, (_, i) => ({
      x: 70 + l * 160,
      y: H / 2 + (i - (count - 1) / 2) * 78,
    })),
  )

  useInterval(
    () => {
      setAnimation((a) => {
        if (!a) return null
        if (a.kind === 'forward') return a.layer >= 3 ? null : { ...a, layer: a.layer + 1 }
        return a.layer <= 0 ? null : { ...a, layer: a.layer - 1 }
      })
    },
    420,
    animation !== null,
  )

  const apply = () => {
    const current = inspect(network)
    setNetwork((net) => ({
      weights: net.weights.map((matrix, l) =>
        matrix.map((row, j) => row.map((w, i) => w - lr * current.gradients[l][j][i])),
      ),
      biases: net.biases.map((layer, l) => layer.map((b, j) => b - lr * current.deltas[l][j])),
    }))
    setAnimation({ kind: 'backward', layer: 2 })
  }
  const meanMagnitude = (layer: number) => {
    const flat = info.gradients[layer].flat().map(Math.abs)
    return flat.reduce((a, b) => a + b, 0) / flat.length
  }

  return (
    <div className="flex flex-col gap-4">
      <Row>
        <Btn onClick={() => setAnimation({ kind: 'forward', layer: 0 })}>Forward</Btn>
        <Btn onClick={() => setAnimation({ kind: 'backward', layer: 2 })}>Backward</Btn>
        <Btn onClick={apply} variant="primary">
          Passo completo
        </Btn>
        <Btn
          onClick={() => {
            setNetwork(INITIAL)
            setAnimation(null)
          }}
          variant="danger"
        >
          Zerar
        </Btn>
      </Row>
      <Plot w={W} h={H} aria-label="Rede neural com ativações e gradientes por camada">
        {network.weights.flatMap((matrix, l) =>
          matrix.flatMap((row, j) =>
            row.map((weight, i) => {
              const from = positions[l][i]
              const to = positions[l + 1][j]
              const grad = info.gradients[l][j][i]
              const activeForward = animation?.kind === 'forward' && animation.layer >= l + 1
              const activeBackward = animation?.kind === 'backward' && animation.layer <= l
              return (
                <g key={`${l}-${j}-${i}`}>
                  <line
                    x1={from.x + 18}
                    y1={from.y}
                    x2={to.x - 18}
                    y2={to.y}
                    stroke={activeBackward ? VIZ.c : activeForward ? VIZ.a : VIZ.border}
                    strokeWidth={
                      activeBackward
                        ? 1.5 + Math.min(7, Math.abs(grad) * 140)
                        : 1.4 + Math.abs(weight)
                    }
                    opacity={activeForward || activeBackward ? 0.95 : 0.55}
                  />
                  {activeBackward && (
                    <text
                      x={(from.x + to.x) / 2}
                      y={(from.y + to.y) / 2 - 4}
                      fill={VIZ.c}
                      fontSize={8}
                      textAnchor="middle"
                    >
                      Δ{(-lr * grad).toFixed(3)}
                    </text>
                  )}
                </g>
              )
            }),
          ),
        )}
        {positions.flatMap((layer, l) =>
          layer.map((p, i) => {
            const lit =
              animation?.kind === 'forward'
                ? animation.layer >= l
                : animation?.kind === 'backward'
                  ? animation.layer < l
                  : false
            return (
              <g key={`${l}-${i}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={20}
                  fill={lit ? (animation?.kind === 'backward' ? VIZ.c : VIZ.a) : VIZ.surface}
                  opacity={lit ? 0.24 : 1}
                  stroke={lit ? (animation?.kind === 'backward' ? VIZ.c : VIZ.a) : VIZ.border}
                  strokeWidth={2}
                />
                <text x={p.x} y={p.y + 4} textAnchor="middle" fill={VIZ.ink} fontSize={10}>
                  {info.activations[l][i].toFixed(2)}
                </text>
              </g>
            )
          }),
        )}
        <text x={70} y={24} textAnchor="middle" fill={VIZ.muted} fontSize={10}>
          entrada
        </text>
        <text x={230} y={24} textAnchor="middle" fill={VIZ.muted} fontSize={10}>
          oculta 1
        </text>
        <text x={390} y={24} textAnchor="middle" fill={VIZ.muted} fontSize={10}>
          oculta 2
        </text>
        <text x={550} y={24} textAnchor="middle" fill={VIZ.muted} fontSize={10}>
          saída
        </text>
      </Plot>
      <Controls cols={1}>
        <Slider
          label="learning rate"
          value={lr}
          onChange={setLr}
          min={0.01}
          max={1}
          step={0.01}
          format={(v) => v.toFixed(2)}
        />
      </Controls>
      <Stats>
        <Stat label="perda" value={info.loss.toFixed(5)} tone="accent" />
        <Stat label="gradiente camada 1" value={meanMagnitude(0).toFixed(5)} tone="amber" />
        <Stat label="gradiente última" value={meanMagnitude(2).toFixed(5)} tone="violet" />
        <Stat label="saída / alvo" value={`${info.output.toFixed(2)} / ${TARGET}`} />
      </Stats>
      <Caption>
        No backward, espessura âmbar representa a magnitude e Δ mostra a atualização. O gradiente
        que chega à primeira camada é menor que o da última: repetido em redes profundas, esse
        encolhimento vira vanishing gradient.
      </Caption>
    </div>
  )
}
