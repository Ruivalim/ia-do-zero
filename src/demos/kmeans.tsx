import { useCallback, useMemo, useState } from 'react'
import {
  Badge,
  Btn,
  Caption,
  Controls,
  Plot,
  Row,
  Slider,
  Stat,
  Stats,
  VIZ,
  SERIES,
} from '../components/ui'
import { useInterval } from '../lib/hooks'
import { gaussian, rng } from '../lib/mathx'

const W = 520
const H = 310
type Point = { x: number; y: number }
type Center = Point & { px: number; py: number }
type Phase = 'atribuir' | 'mover'

function makePoints(seed: number): Point[] {
  const next = rng(31 + seed)
  return [
    [0.23, 0.3],
    [0.7, 0.28],
    [0.52, 0.72],
  ].flatMap(([cx, cy]) =>
    Array.from({ length: 30 }, () => ({
      x: gaussian(next, cx, 0.095),
      y: gaussian(next, cy, 0.1),
    })),
  )
}

function makeCenters(k: number, seed: number): Center[] {
  const next = rng(997 + seed * 17 + k)
  return Array.from({ length: k }, () => {
    const x = 0.1 + next() * 0.8
    const y = 0.1 + next() * 0.8
    return { x, y, px: x, py: y }
  })
}

const nearest = (p: Point, centers: Center[]) =>
  centers.reduce(
    (best, c, i) =>
      (p.x - c.x) ** 2 + (p.y - c.y) ** 2 <
      (p.x - centers[best].x) ** 2 + (p.y - centers[best].y) ** 2
        ? i
        : best,
    0,
  )

export default function KmeansDemo() {
  const [seed, setSeed] = useState(0)
  const [k, setK] = useState(3)
  const [centers, setCenters] = useState(() => makeCenters(3, 0))
  const [groups, setGroups] = useState<number[]>([])
  const [phase, setPhase] = useState<Phase>('atribuir')
  const [iteration, setIteration] = useState(0)
  const [changed, setChanged] = useState(0)
  const [running, setRunning] = useState(false)
  const points = useMemo(() => makePoints(seed), [seed])

  const resetCenters = useCallback(
    (nextK = k, nextSeed = seed) => {
      setRunning(false)
      setCenters(makeCenters(nextK, nextSeed))
      setGroups([])
      setPhase('atribuir')
      setIteration(0)
      setChanged(0)
    },
    [k, seed],
  )

  const step = useCallback(() => {
    if (phase === 'atribuir') {
      const next = points.map((p) => nearest(p, centers))
      setChanged(next.filter((g, i) => g !== groups[i]).length)
      setGroups(next)
      setPhase('mover')
    } else {
      setCenters((old) =>
        old.map((c, i) => {
          const own = points.filter((_, j) => groups[j] === i)
          if (!own.length) return c
          return {
            x: own.reduce((s, p) => s + p.x, 0) / own.length,
            y: own.reduce((s, p) => s + p.y, 0) / own.length,
            px: c.x,
            py: c.y,
          }
        }),
      )
      setIteration((n) => n + 1)
      setPhase('atribuir')
    }
  }, [centers, groups, phase, points])
  useInterval(step, 500, running)
  const inertia = points.reduce((s, p, i) => {
    const c = centers[groups[i] ?? nearest(p, centers)]
    return s + (p.x - c.x) ** 2 + (p.y - c.y) ** 2
  }, 0)

  return (
    <div className="flex flex-col gap-4">
      <Row>
        <Btn onClick={step} disabled={running}>
          Passo
        </Btn>
        <Btn onClick={() => setRunning((v) => !v)} variant="primary">
          {running ? 'Pausar' : 'Rodar'}
        </Btn>
        <Btn onClick={() => resetCenters()}>Reiniciar centros</Btn>
        <Btn
          onClick={() => {
            const s = seed + 1
            setSeed(s)
            resetCenters(k, s)
          }}
        >
          Nova semente
        </Btn>
        <Badge tone={phase === 'atribuir' ? 'accent' : 'amber'}>{phase}</Badge>
      </Row>
      <Plot w={W} h={H} aria-label="Pontos e centros do k-means">
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x * W}
            cy={p.y * H}
            r={4.2}
            fill={groups[i] === undefined ? VIZ.muted : SERIES[groups[i] % SERIES.length]}
            opacity={0.82}
          />
        ))}
        {centers.map((c, i) => (
          <g key={i}>
            <line
              x1={c.px * W}
              y1={c.py * H}
              x2={c.x * W}
              y2={c.y * H}
              stroke={SERIES[i]}
              strokeWidth={1.5}
              opacity={0.7}
            />
            <circle
              cx={c.x * W}
              cy={c.y * H}
              r={10}
              fill={VIZ.surface}
              stroke={SERIES[i]}
              strokeWidth={4}
              style={{ transition: 'all 420ms ease-out' }}
            />
            <text x={c.x * W} y={c.y * H + 3.5} textAnchor="middle" fill={VIZ.ink} fontSize={10}>
              {i + 1}
            </text>
          </g>
        ))}
      </Plot>
      <Controls cols={1}>
        <Slider
          label="número de grupos k"
          value={k}
          onChange={(v) => {
            setK(v)
            resetCenters(v, seed)
          }}
          min={2}
          max={6}
        />
      </Controls>
      <Stats>
        <Stat label="iteração" value={iteration} />
        <Stat label="inércia" value={inertia.toFixed(3)} tone="accent" />
        <Stat
          label="trocaram de grupo"
          value={changed}
          tone={changed === 0 ? 'emerald' : 'amber'}
        />
        <Stat label="fase" value={phase} />
      </Stats>
      <Caption>
        O algoritmo alterna atribuição e movimento; ele não reconsidera decisões globalmente. Uma
        semente ruim pode prender centros no mesmo blob e deixar outro mal representado, com inércia
        maior.
      </Caption>
    </div>
  )
}
