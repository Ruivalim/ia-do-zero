import { useMemo, useState } from 'react'
import {
  Btn,
  Caption,
  Choice,
  Controls,
  Panel,
  Plot,
  Row,
  Slider,
  Stat,
  Stats,
  Toggle,
  VIZ,
} from '../components/ui'
import { useInterval } from '../lib/hooks'
const W = 760
const H = 300
type ImageName = 'círculo' | 'quadrado' | 'diagonal'
type KernelName = 'identidade' | 'horizontal' | 'vertical' | 'blur' | 'sharpen' | 'editar'
const KERNELS: Record<Exclude<KernelName, 'editar'>, number[]> = {
  identidade: [0, 0, 0, 0, 1, 0, 0, 0, 0],
  horizontal: [-1, -2, -1, 0, 0, 0, 1, 2, 1],
  vertical: [-1, 0, 1, -2, 0, 2, -1, 0, 1],
  blur: Array(9).fill(1 / 9),
  sharpen: [0, -1, 0, -1, 5, -1, 0, -1, 0],
}

function makeImage(name: ImageName) {
  return Array.from({ length: 256 }, (_, i) => {
    const x = i % 16
    const y = Math.floor(i / 16)
    if (name === 'círculo') return Math.hypot(x - 7.5, y - 7.5) < 5 ? 1 : 0.08
    if (name === 'quadrado') return x > 3 && x < 12 && y > 3 && y < 12 ? 0.9 : 0.08
    return Math.abs(x - y) < 2 || Math.abs(x + y - 15) < 1 ? 1 : 0.06
  })
}

function convolve(image: number[], kernel: number[], index: number, relu: boolean) {
  const row = Math.floor(index / 14)
  const col = index % 14
  const products = kernel.map((k, i) => k * image[(row + Math.floor(i / 3)) * 16 + col + (i % 3)])
  const raw = products.reduce((a, b) => a + b, 0)
  return { products, value: relu ? Math.max(0, raw) : raw }
}

export default function ConvolutionDemo() {
  const [imageName, setImageName] = useState<ImageName>('círculo')
  const [kernelName, setKernelName] = useState<KernelName>('horizontal')
  const [custom, setCustom] = useState(KERNELS.sharpen)
  const [processed, setProcessed] = useState(0)
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(6)
  const [relu, setRelu] = useState(true)
  const image = useMemo(() => makeImage(imageName), [imageName])
  const kernel = kernelName === 'editar' ? custom : KERNELS[kernelName]
  const current = Math.min(processed, 195)
  const result = convolve(image, kernel, current, relu)
  const output = useMemo(
    () => Array.from({ length: 196 }, (_, i) => convolve(image, kernel, i, relu).value),
    [image, kernel, relu],
  )
  const maxAbs = Math.max(1, ...output.map(Math.abs))
  const reset = () => {
    setRunning(false)
    setProcessed(0)
  }
  const step = () =>
    setProcessed((n) => {
      if (n >= 196) {
        setRunning(false)
        return n
      }
      return n + 1
    })
  useInterval(step, 900 / speed, running)
  const cell = 13
  const inX = 18
  const outX = 542
  const kX = 301
  const row = Math.floor(current / 14)
  const col = current % 14

  return (
    <div className="flex flex-col gap-4">
      <Row>
        <Choice
          value={imageName}
          onChange={(v) => {
            setImageName(v)
            reset()
          }}
          options={[
            { value: 'círculo', label: 'Círculo' },
            { value: 'quadrado', label: 'Quadrado' },
            { value: 'diagonal', label: 'Diagonal' },
          ]}
        />
        <Choice
          value={kernelName}
          onChange={(v) => {
            setKernelName(v)
            reset()
          }}
          options={[
            { value: 'identidade', label: 'Identidade' },
            { value: 'horizontal', label: 'Sobel H' },
            { value: 'vertical', label: 'Sobel V' },
            { value: 'blur', label: 'Blur' },
            { value: 'sharpen', label: 'Sharpen' },
            { value: 'editar', label: 'Editar' },
          ]}
        />
      </Row>
      <Plot w={W} h={H} aria-label="Imagem, kernel e mapa de saída da convolução">
        {image.map((v, i) => (
          <rect
            key={`i${i}`}
            x={inX + (i % 16) * cell}
            y={38 + Math.floor(i / 16) * cell}
            width={cell - 1}
            height={cell - 1}
            fill={VIZ.ink}
            opacity={0.06 + 0.88 * v}
          />
        ))}
        <rect
          x={inX + col * cell - 2}
          y={38 + row * cell - 2}
          width={cell * 3 + 3}
          height={cell * 3 + 3}
          fill="none"
          stroke={VIZ.c}
          strokeWidth={3}
        />
        {kernel.map((v, i) => (
          <g key={`k${i}`}>
            <rect
              x={kX + (i % 3) * 40}
              y={78 + Math.floor(i / 3) * 40}
              width={36}
              height={36}
              fill={v >= 0 ? VIZ.a : VIZ.e}
              opacity={0.12 + Math.min(0.65, Math.abs(v) * 0.35)}
            />
            <text
              x={kX + (i % 3) * 40 + 18}
              y={101 + Math.floor(i / 3) * 40}
              textAnchor="middle"
              fill={VIZ.ink}
              fontSize={10}
            >
              {v.toFixed(2)}
            </text>
          </g>
        ))}
        {output.map(
          (v, i) =>
            i < processed && (
              <rect
                key={`o${i}`}
                x={outX + (i % 14) * cell}
                y={51 + Math.floor(i / 14) * cell}
                width={cell - 1}
                height={cell - 1}
                fill={v >= 0 ? VIZ.a : VIZ.e}
                opacity={0.08 + (0.82 * Math.abs(v)) / maxAbs}
              />
            ),
        )}
        <text x={122} y={24} textAnchor="middle" fill={VIZ.muted} fontSize={11}>
          entrada 16×16
        </text>
        <text x={357} y={62} textAnchor="middle" fill={VIZ.muted} fontSize={11}>
          kernel 3×3
        </text>
        <text x={633} y={37} textAnchor="middle" fill={VIZ.muted} fontSize={11}>
          saída 14×14
        </text>
      </Plot>
      {kernelName === 'editar' && (
        <Panel title="Kernel editável">
          <div className="grid max-w-56 grid-cols-3 gap-1">
            {custom.map((v, i) => (
              <input
                key={i}
                type="number"
                step="0.1"
                value={v}
                aria-label={`Valor ${i + 1} do kernel`}
                onChange={(e) =>
                  setCustom((old) => old.map((x, j) => (j === i ? Number(e.target.value) : x)))
                }
                className="min-w-0 rounded-md border border-line bg-surface px-1 py-1 text-center font-mono text-xs text-ink"
              />
            ))}
          </div>
        </Panel>
      )}
      <Panel title="Conta da célula atual">
        <div className="font-mono text-xs leading-6 text-muted">
          {result.products.map((v) => v.toFixed(2)).join(' + ')} ={' '}
          <span className="text-ink">{result.value.toFixed(2)}</span>
        </div>
      </Panel>
      <Row>
        <Btn onClick={() => setRunning((v) => !v)} variant="primary">
          {running ? 'Pausar' : 'Rodar'}
        </Btn>
        <Btn onClick={step} disabled={running || processed >= 196}>
          Um passo
        </Btn>
        <Toggle
          label="ReLU na saída"
          checked={relu}
          onChange={(v) => {
            setRelu(v)
            reset()
          }}
        />
      </Row>
      <Controls cols={1}>
        <Slider label="velocidade" value={speed} onChange={setSpeed} min={1} max={16} />
      </Controls>
      <Stats>
        <Stat label="posição" value={`(${row}, ${col})`} />
        <Stat label="saída atual" value={result.value.toFixed(3)} tone="accent" />
        <Stat label="multiplicações" value={processed * 9} />
      </Stats>
      <Caption>
        O mesmo kernel faz nove multiplicações em cada posição. Sobel horizontal responde a mudanças
        verticais de intensidade; com ReLU, toda resposta negativa é cortada e metade da orientação
        pode desaparecer.
      </Caption>
    </div>
  )
}
