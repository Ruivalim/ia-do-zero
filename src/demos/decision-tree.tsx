import { useMemo, useState } from 'react'
import { Caption, Controls, Plot, Slider, Stat, Stats, Toggle, VIZ } from '../components/ui'
import { entropy, gaussian, gini, rng } from '../lib/mathx'

const W = 520
const H = 310
type Point = { x: number; y: number; c: 0 | 1 }
type Box = { x0: number; x1: number; y0: number; y1: number }
type Node = {
  points: Point[]
  box: Box
  impurity: number
  prediction: 0 | 1
  axis?: 'x' | 'y'
  threshold?: number
  left?: Node
  right?: Node
}

function makeData(): Point[] {
  const next = rng(9)
  return Array.from({ length: 64 }, (_, i) => {
    const x = 0.04 + next() * 0.92
    const y = 0.04 + next() * 0.92
    const cross =
      (x > 0.16 && x < 0.38 && y > 0.18 && y < 0.82) ||
      (y > 0.58 && y < 0.79 && x > 0.2 && x < 0.88)
    const noisy = i > 57 && gaussian(next) > 0.15
    return { x, y, c: (cross !== noisy ? 1 : 0) as 0 | 1 }
  })
}

const DATA = makeData()
const counts = (ps: Point[]) => [
  ps.filter((p) => p.c === 0).length,
  ps.filter((p) => p.c === 1).length,
]

function build(points: Point[], box: Box, depth: number, maxDepth: number, useGini: boolean): Node {
  const cs = counts(points)
  const impurity = useGini ? gini(cs) : entropy(cs.map((c) => c / Math.max(1, points.length)))
  const base: Node = { points, box, impurity, prediction: cs[1] >= cs[0] ? 1 : 0 }
  if (depth >= maxDepth || points.length <= 1 || impurity === 0) return base
  let best:
    { score: number; axis: 'x' | 'y'; threshold: number; left: Point[]; right: Point[] } | undefined
  for (const axis of ['x', 'y'] as const) {
    for (let i = 1; i <= 20; i++) {
      const lo = axis === 'x' ? box.x0 : box.y0
      const hi = axis === 'x' ? box.x1 : box.y1
      const threshold = lo + (i / 21) * (hi - lo)
      const left = points.filter((p) => p[axis] < threshold)
      const right = points.filter((p) => p[axis] >= threshold)
      if (!left.length || !right.length) continue
      const impurityOf = (part: Point[]) =>
        useGini ? gini(counts(part)) : entropy(counts(part).map((c) => c / part.length))
      const score =
        (left.length * impurityOf(left) + right.length * impurityOf(right)) / points.length
      if (!best || score < best.score) best = { score, axis, threshold, left, right }
    }
  }
  if (!best || best.score >= impurity - 1e-9) return base
  const leftBox = {
    ...box,
    ...(best.axis === 'x' ? { x1: best.threshold } : { y1: best.threshold }),
  }
  const rightBox = {
    ...box,
    ...(best.axis === 'x' ? { x0: best.threshold } : { y0: best.threshold }),
  }
  return {
    ...base,
    axis: best.axis,
    threshold: best.threshold,
    left: build(best.left, leftBox, depth + 1, maxDepth, useGini),
    right: build(best.right, rightBox, depth + 1, maxDepth, useGini),
  }
}

const leavesOf = (n: Node): Node[] =>
  n.left && n.right ? [...leavesOf(n.left), ...leavesOf(n.right)] : [n]
const nodesAt = (root: Node) => {
  const out: { node: Node; depth: number; x: number; parent?: { x: number; depth: number } }[] = []
  let cursor = 0
  const walk = (node: Node, depth: number, parent?: { x: number; depth: number }): number => {
    if (!node.left || !node.right) {
      const x = cursor++
      out.push({ node, depth, x, parent })
      return x
    }
    const left = walk(node.left, depth + 1)
    const right = walk(node.right, depth + 1)
    const x = (left + right) / 2
    out.push({ node, depth, x, parent })
    const here = { x, depth }
    out.forEach((item) => {
      if (
        item.parent === undefined &&
        item.depth === depth + 1 &&
        (item.x === left || item.x === right)
      )
        item.parent = here
    })
    return x
  }
  walk(root, 0)
  return out
}

export default function DecisionTreeDemo() {
  const [depth, setDepth] = useState(3)
  const [useGini, setUseGini] = useState(true)
  const tree = useMemo(
    () => build(DATA, { x0: 0, x1: 1, y0: 0, y1: 1 }, 0, depth, useGini),
    [depth, useGini],
  )
  const leaves = leavesOf(tree)
  const correct = leaves.reduce(
    (s, leaf) => s + leaf.points.filter((p) => p.c === leaf.prediction).length,
    0,
  )
  const weighted =
    leaves.reduce((s, leaf) => s + leaf.impurity * leaf.points.length, 0) / DATA.length
  const layout = nodesAt(tree)
  const maxX = Math.max(1, ...layout.map((n) => n.x))
  const tx = (x: number) => 25 + (x / maxX) * (W - 50)
  const ty = (d: number) => 24 + (d / Math.max(1, depth)) * (H - 48)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Plot w={W} h={H} aria-label="Regiões e cortes da árvore de decisão">
          {leaves.map((leaf, i) => (
            <rect
              key={i}
              x={leaf.box.x0 * W}
              y={leaf.box.y0 * H}
              width={(leaf.box.x1 - leaf.box.x0) * W}
              height={(leaf.box.y1 - leaf.box.y0) * H}
              fill={leaf.prediction ? VIZ.d : VIZ.e}
              opacity={0.14 + Math.min(0.12, leaf.points.length / 150)}
              stroke={VIZ.border}
            />
          ))}
          {DATA.map((p, i) => (
            <circle
              key={i}
              cx={p.x * W}
              cy={p.y * H}
              r={4}
              fill={p.c ? VIZ.d : VIZ.e}
              stroke={VIZ.surface}
              strokeWidth={1}
            />
          ))}
        </Plot>
        <Plot w={W} h={H} aria-label="Estrutura da árvore de decisão">
          {layout.map(
            (item, i) =>
              item.parent && (
                <line
                  key={`e${i}`}
                  x1={tx(item.parent.x)}
                  y1={ty(item.parent.depth) + 11}
                  x2={tx(item.x)}
                  y2={ty(item.depth) - 11}
                  stroke={VIZ.border}
                />
              ),
          )}
          {layout.map((item, i) => {
            const label = item.node.axis
              ? `${item.node.axis === 'x' ? 'x₁' : 'x₂'} < ${item.node.threshold?.toFixed(2)}`
              : `classe ${item.node.prediction}`
            return (
              <g key={`n${i}`}>
                <rect
                  x={tx(item.x) - 31}
                  y={ty(item.depth) - 12}
                  width={62}
                  height={24}
                  rx={5}
                  fill={VIZ.surface}
                  stroke={item.node.axis ? VIZ.a : item.node.prediction ? VIZ.d : VIZ.e}
                />
                <text
                  x={tx(item.x)}
                  y={ty(item.depth) - 1}
                  textAnchor="middle"
                  fill={VIZ.ink}
                  fontSize={9}
                >
                  {label}
                </text>
                <text
                  x={tx(item.x)}
                  y={ty(item.depth) + 9}
                  textAnchor="middle"
                  fill={VIZ.muted}
                  fontSize={7}
                >
                  I={item.node.impurity.toFixed(2)} · n={item.node.points.length}
                </text>
              </g>
            )
          })}
        </Plot>
      </div>
      <Controls>
        <Slider label="profundidade máxima" value={depth} onChange={setDepth} min={1} max={6} />
        <Toggle
          label={useGini ? 'usar Gini' : 'usar entropia'}
          checked={useGini}
          onChange={setUseGini}
        />
      </Controls>
      <Stats>
        <Stat label="folhas" value={leaves.length} />
        <Stat label="impureza ponderada" value={weighted.toFixed(3)} />
        <Stat
          label="acurácia treino"
          value={`${Math.round((correct / DATA.length) * 100)}%`}
          tone="emerald"
        />
        <Stat
          label="folhas unitárias"
          value={leaves.filter((l) => l.points.length === 1).length}
          tone="amber"
        />
      </Stats>
      <Caption>
        Mais profundidade recorta melhor o padrão, mas também cria folhas para exemplos isolados. Na
        profundidade 6, folhas unitárias denunciam que a árvore começou a memorizar ruído.
      </Caption>
    </div>
  )
}
