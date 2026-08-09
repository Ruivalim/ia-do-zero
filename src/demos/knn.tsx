import { useMemo, useRef, useState } from 'react'
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
import { useSvgPointer } from '../lib/hooks'
import { gaussian, rng } from '../lib/mathx'

const W = 520
const H = 310
const COLORS = [VIZ.a, VIZ.c, VIZ.b]
type ClassId = '0' | '1' | '2'
type Metric = 'euclidiana' | 'manhattan'
type Point = { x: number; y: number; c: number }

function initialData(): Point[] {
  const next = rng(5)
  const centers = [
    [0.27, 0.31],
    [0.7, 0.35],
    [0.5, 0.72],
  ]
  return centers.flatMap(([cx, cy], c) =>
    Array.from({ length: 15 }, () => ({
      x: gaussian(next, cx, 0.13),
      y: gaussian(next, cy, 0.13),
      c,
    })),
  )
}

function classify(x: number, y: number, data: Point[], k: number, metric: Metric, skip = -1) {
  if (!data.length) return 0
  const ranked = data
    .map((p, i) => ({
      c: p.c,
      i,
      d:
        metric === 'euclidiana'
          ? (p.x - x) ** 2 + (p.y - y) ** 2
          : Math.abs(p.x - x) + Math.abs(p.y - y),
    }))
    .filter((p) => p.i !== skip)
    .sort((a, b) => a.d - b.d)
  const votes = [0, 0, 0]
  ranked.slice(0, Math.min(k, ranked.length)).forEach((p) => {
    votes[p.c] += 1
  })
  return votes.indexOf(Math.max(...votes))
}

export default function KnnDemo() {
  const [data, setData] = useState(initialData)
  const [k, setK] = useState(5)
  const [metric, setMetric] = useState<Metric>('euclidiana')
  const [selected, setSelected] = useState<ClassId>('0')
  const svgRef = useRef<SVGSVGElement | null>(null)
  const pointer = useSvgPointer(svgRef)
  const cells = useMemo(
    () =>
      Array.from({ length: 48 * 30 }, (_, i) => {
        const col = i % 48
        const row = Math.floor(i / 48)
        return { col, row, c: classify((col + 0.5) / 48, (row + 0.5) / 30, data, k, metric) }
      }),
    [data, k, metric],
  )
  const accuracy =
    data.length < 2
      ? 0
      : data.filter((p, i) => classify(p.x, p.y, data, k, metric, i) === p.c).length / data.length

  return (
    <div className="flex flex-col gap-4">
      <Row>
        <Choice
          label="classe do novo ponto"
          value={selected}
          onChange={setSelected}
          options={[
            { value: '0', label: 'Ciano' },
            { value: '1', label: 'Âmbar' },
            { value: '2', label: 'Violeta' },
          ]}
        />
        <Btn onClick={() => setData([])} variant="danger">
          Limpar
        </Btn>
        <Btn onClick={() => setData(initialData())}>Restaurar</Btn>
      </Row>
      <Plot
        w={W}
        h={H}
        svgRef={svgRef}
        aria-label="Fronteira de decisão KNN; clique para adicionar um ponto"
        onClick={(e) => {
          const p = pointer(e)
          setData((d) => [...d, { x: p.x / W, y: p.y / H, c: Number(selected) }])
        }}
      >
        {cells.map((cell) => (
          <rect
            key={`${cell.col}-${cell.row}`}
            x={(cell.col * W) / 48}
            y={(cell.row * H) / 30}
            width={W / 48 + 0.5}
            height={H / 30 + 0.5}
            fill={COLORS[cell.c]}
            opacity={0.18}
          />
        ))}
        {data.map((p, i) => (
          <circle
            key={i}
            cx={p.x * W}
            cy={p.y * H}
            r={5}
            fill={COLORS[p.c]}
            stroke={VIZ.surface}
            strokeWidth={1.5}
          />
        ))}
      </Plot>
      <Controls>
        <Slider label="vizinhos k" value={k} onChange={setK} min={1} max={21} step={2} />
        <Choice
          label="métrica"
          value={metric}
          onChange={setMetric}
          options={[
            { value: 'euclidiana', label: 'Euclidiana' },
            { value: 'manhattan', label: 'Manhattan' },
          ]}
        />
      </Controls>
      <Stats>
        <Stat label="k" value={k} />
        <Stat label="pontos" value={data.length} />
        <Stat
          label="acurácia LOO"
          value={`${Math.round(accuracy * 100)}%`}
          tone={accuracy > 0.8 ? 'emerald' : 'amber'}
        />
      </Stats>
      <Caption>
        Com k = 1, cada ponto isolado pode criar uma ilha. Aumentar k suaviza a fronteira, mas k
        alto demais engole regiões pequenas. Clique no plano para testar ruído e sobreposição.
      </Caption>
    </div>
  )
}
