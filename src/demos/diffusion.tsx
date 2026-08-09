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
  Toggle,
  VIZ,
} from '../components/ui'
import { useInterval } from '../lib/hooks'
import { clamp, rng } from '../lib/mathx'

const W = 620
const H = 300
type TargetName = 'rosto' | 'diamante' | 'espiral'

function target(name: TargetName) {
  return Array.from({ length: 32 * 32 }, (_, i) => {
    const x = i % 32
    const y = Math.floor(i / 32)
    if (name === 'rosto') {
      const face = Math.hypot(x - 15.5, y - 15.5) < 11.5
      const eyes = Math.hypot(x - 11, y - 13) < 1.6 || Math.hypot(x - 20, y - 13) < 1.6
      const smile = y > 18 && y < 23 && Math.abs(Math.hypot(x - 15.5, y - 14) - 8) < 1.3
      return face ? (eyes || smile ? 0.05 : 0.88) : 0.03
    }
    if (name === 'diamante') return Math.abs(x - 15.5) + Math.abs(y - 15.5) < 11 ? 0.95 : 0.03
    const dx = x - 15.5
    const dy = y - 15.5
    const a = Math.atan2(dy, dx)
    const r = Math.hypot(dx, dy)
    return Math.abs(r - (2.5 + ((a + Math.PI) / (2 * Math.PI)) * 10)) < 1.5 ||
      Math.abs(r - (8.5 + ((a + Math.PI) / (2 * Math.PI)) * 5)) < 1.2
      ? 0.95
      : 0.03
  })
}

const next = rng(409)
const NOISE = Array.from({ length: 32 * 32 }, () => next() * 2 - 1)
const TARGETS: TargetName[] = ['rosto', 'diamante', 'espiral']

export default function DiffusionDemo() {
  const [step, setStep] = useState(10)
  const [direction, setDirection] = useState<1 | -1 | 0>(0)
  const [conditioned, setConditioned] = useState(true)
  const [targetName, setTargetName] = useState<TargetName>('rosto')
  const alpha = Math.sin(((step / 30) * Math.PI) / 2) ** 2
  const targets = useMemo(
    () =>
      Object.fromEntries(TARGETS.map((name) => [name, target(name)])) as Record<
        TargetName,
        number[]
      >,
    [],
  )
  const chosen = conditioned
    ? targets[targetName]
    : targets.rosto.map(
        (_, i) => TARGETS.reduce((s, name) => s + targets[name][i], 0) / TARGETS.length,
      )
  const mixed = chosen.map((v, i) => Math.sqrt(alpha) * v + Math.sqrt(1 - alpha) * NOISE[i])
  const predictedNoise = mixed.map((v, i) => v - Math.sqrt(alpha) * chosen[i])
  useInterval(
    () =>
      setStep((t) => {
        const value = clamp(t + direction, 0, 30)
        if (value === 0 || value === 30) setDirection(0)
        return value
      }),
    90,
    direction !== 0,
  )
  const cell = 7.3
  const drawGrid = (values: number[], x0: number, signal: boolean) =>
    values.map((v, i) => {
      const targetColor =
        alpha === 0
          ? VIZ.ink
          : targetName === 'rosto'
            ? VIZ.a
            : targetName === 'diamante'
              ? VIZ.b
              : VIZ.c
      return (
        <rect
          key={i}
          x={x0 + (i % 32) * cell}
          y={38 + Math.floor(i / 32) * cell}
          width={cell - 0.35}
          height={cell - 0.35}
          fill={v >= 0 ? (signal ? targetColor : VIZ.ink) : VIZ.e}
          opacity={0.04 + Math.min(0.92, Math.abs(v) * 0.78)}
        />
      )
    })
  const snr = alpha / Math.max(1e-6, 1 - alpha)

  return (
    <div className="flex flex-col gap-4">
      <Row>
        <Btn
          onClick={() => {
            setStep(0)
            setDirection(1)
          }}
          variant="primary"
        >
          Gerar
        </Btn>
        <Btn
          onClick={() => {
            setStep(30)
            setDirection(-1)
          }}
        >
          Adicionar ruído
        </Btn>
        <Choice
          value={targetName}
          onChange={setTargetName}
          options={[
            { value: 'rosto', label: 'Rosto' },
            { value: 'diamante', label: 'Diamante' },
            { value: 'espiral', label: 'Espiral' },
          ]}
        />
      </Row>
      <Plot w={W} h={H} aria-label="Imagem em difusão e componente de ruído previsto">
        {drawGrid(mixed, 40, true)}
        {drawGrid(predictedNoise, 347, false)}
        <text x={157} y={24} textAnchor="middle" fill={VIZ.muted} fontSize={11}>
          xₜ: sinal + ruído
        </text>
        <text x={464} y={24} textAnchor="middle" fill={VIZ.muted} fontSize={11}>
          ruído a estimar
        </text>
      </Plot>
      <Controls>
        <Slider
          label="passo t"
          value={step}
          onChange={(v) => {
            setStep(v)
            setDirection(0)
          }}
          min={0}
          max={30}
        />
        <Toggle label="condicionamento" checked={conditioned} onChange={setConditioned} />
      </Controls>
      <Stats>
        <Stat label="passo" value={step} />
        <Stat label="alpha acumulado" value={alpha.toFixed(3)} tone="accent" />
        <Stat label="sinal-ruído" value={snr > 999 ? '∞' : snr.toFixed(2)} />
        <Stat label="alvo" value={conditioned ? targetName : 'médio'} tone="violet" />
      </Stats>
      <Caption>
        Em t = 0 há só o mesmo ruído inicial. O condicionamento decide qual imagem emerge dele. A
        segunda grade mostra o componente que uma rede de diffusion aprende a estimar e remover em
        cada passo.
      </Caption>
    </div>
  )
}
