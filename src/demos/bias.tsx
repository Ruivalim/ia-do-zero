import { useMemo, useState } from 'react'
import {
  Badge,
  Btn,
  Caption,
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
import { clamp, gaussian, rng } from '../lib/mathx'

/* Two populations, one shared ground truth, one biased sample. The model is
   never told which group a point belongs to — the disparity comes entirely
   from who got collected and who got labelled correctly. */

const W = 520
const H = 330
const PAD = 30

type Point = { x: number; y: number; label: 0 | 1; group: 'A' | 'B' }

const toPx = (x: number) => PAD + x * (W - 2 * PAD)
const toPy = (y: number) => H - PAD - y * (H - 2 * PAD)

/** the real rule, identical for both groups — nobody is intrinsically different */
const truth = (x: number, y: number): 0 | 1 => (0.55 * x + 0.75 * y > 0.62 ? 1 : 0)

const POPULATION: Point[] = (() => {
  const next = rng(21)
  const out: Point[] = []
  // group A lives on the left half of the feature space, group B on the right
  for (let i = 0; i < 150; i++) {
    const x = clamp(gaussian(next, 0.34, 0.15), 0.02, 0.98)
    const y = clamp(gaussian(next, 0.5, 0.22), 0.02, 0.98)
    out.push({ x, y, label: truth(x, y), group: 'A' })
  }
  for (let i = 0; i < 150; i++) {
    const x = clamp(gaussian(next, 0.72, 0.14), 0.02, 0.98)
    const y = clamp(gaussian(next, 0.44, 0.22), 0.02, 0.98)
    out.push({ x, y, label: truth(x, y), group: 'B' })
  }
  return out
})()

type Model = { w1: number; w2: number; b: number }

function fitLogistic(sample: { x: number; y: number; label: number }[]): Model {
  let w1 = 0
  let w2 = 0
  let b = 0
  const lr = 0.9
  for (let step = 0; step < 600; step++) {
    let g1 = 0
    let g2 = 0
    let gb = 0
    for (const s of sample) {
      const z = w1 * s.x + w2 * s.y + b
      const p = 1 / (1 + Math.exp(-z))
      const e = p - s.label
      g1 += e * s.x
      g2 += e * s.y
      gb += e
    }
    const n = Math.max(1, sample.length)
    w1 -= (lr * g1) / n
    w2 -= (lr * g2) / n
    b -= (lr * gb) / n
  }
  return { w1, w2, b }
}

const predict = (m: Model, p: { x: number; y: number }) =>
  m.w1 * p.x + m.w2 * p.y + m.b > 0 ? 1 : 0

export default function BiasDemo() {
  const [shareB, setShareB] = useState(8) // % de B que foi coletado
  const [noiseB, setNoiseB] = useState(18) // % de rótulos errados em B
  const [showSample, setShowSample] = useState(true)

  const { model, acc, accA, accB } = useMemo(() => {
    const next = rng(99)
    const sample: { x: number; y: number; label: number }[] = []

    for (const p of POPULATION) {
      if (p.group === 'A') {
        sample.push({ x: p.x, y: p.y, label: p.label })
      } else if (next() * 100 < shareB) {
        const flipped = next() * 100 < noiseB
        sample.push({ x: p.x, y: p.y, label: flipped ? 1 - p.label : p.label })
      }
    }

    const m = fitLogistic(sample)
    const score = (g?: 'A' | 'B') => {
      const set = g ? POPULATION.filter((p) => p.group === g) : POPULATION
      const hits = set.filter((p) => predict(m, p) === p.label).length
      return hits / set.length
    }
    return { model: m, acc: score(), accA: score('A'), accB: score('B'), sampleSize: sample.length }
  }, [shareB, noiseB])

  // boundary line: w1·x + w2·y + b = 0
  const line = useMemo(() => {
    if (Math.abs(model.w2) < 1e-6) return null
    const at = (x: number) => -(model.w1 * x + model.b) / model.w2
    return { x1: 0, y1: at(0), x2: 1, y2: at(1) }
  }, [model])

  const truthLine = { x1: 0, y1: 0.62 / 0.75, x2: 1, y2: (0.62 - 0.55) / 0.75 }
  const gap = accA - accB
  const sampledB = Math.round((150 * shareB) / 100)

  return (
    <div className="flex flex-col gap-4">
      <Plot w={W} h={H} aria-label="Duas populações e a fronteira de decisão aprendida">
        <Grid w={W} h={H} step={50} />

        <line
          x1={toPx(truthLine.x1)}
          y1={toPy(truthLine.y1)}
          x2={toPx(truthLine.x2)}
          y2={toPy(truthLine.y2)}
          stroke={VIZ.muted}
          strokeWidth={1.5}
          strokeDasharray="5 4"
        />

        {POPULATION.map((p, i) => {
          const wrong = predict(model, p) !== p.label
          const color = p.label === 1 ? VIZ.d : VIZ.e
          return (
            <g key={i}>
              {p.group === 'B' ? (
                <rect
                  x={toPx(p.x) - 3.5}
                  y={toPy(p.y) - 3.5}
                  width={7}
                  height={7}
                  fill={wrong ? 'none' : color}
                  stroke={wrong ? VIZ.c : color}
                  strokeWidth={wrong ? 2 : 1}
                  opacity={0.9}
                />
              ) : (
                <circle
                  cx={toPx(p.x)}
                  cy={toPy(p.y)}
                  r={3.8}
                  fill={wrong ? 'none' : color}
                  stroke={wrong ? VIZ.c : color}
                  strokeWidth={wrong ? 2 : 1}
                  opacity={0.9}
                />
              )}
            </g>
          )
        })}

        {line && (
          <line
            x1={toPx(line.x1)}
            y1={toPy(line.y1)}
            x2={toPx(line.x2)}
            y2={toPy(line.y2)}
            stroke={VIZ.a}
            strokeWidth={2.5}
            strokeLinecap="round"
            style={{ transition: 'all 200ms linear' }}
          />
        )}

        {showSample && (
          <text x={PAD} y={PAD - 10} fill={VIZ.axis} fontSize={11}>
            grupo A: 150 coletados · grupo B: {sampledB} coletados
          </text>
        )}
      </Plot>

      <Controls>
        <Slider
          label="quanto do grupo B foi coletado"
          value={shareB}
          onChange={setShareB}
          min={2}
          max={100}
          step={1}
          format={(v) => `${v}%`}
          hint="O grupo A é sempre coletado por inteiro."
        />
        <Slider
          label="erro de rotulagem no grupo B"
          value={noiseB}
          onChange={setNoiseB}
          min={0}
          max={40}
          step={1}
          format={(v) => `${v}%`}
          hint="Anotadores que conhecem menos o grupo erram mais."
        />
      </Controls>

      <Row>
        <Btn
          variant="primary"
          onClick={() => {
            setShareB(100)
            setNoiseB(0)
          }}
        >
          Coletar B por inteiro
        </Btn>
        <Btn
          onClick={() => {
            setShareB(8)
            setNoiseB(18)
          }}
        >
          Voltar ao cenário enviesado
        </Btn>
        <Btn onClick={() => setShowSample((v) => !v)}>
          {showSample ? 'Ocultar' : 'Mostrar'} contagem
        </Btn>
      </Row>

      <Stats>
        <Stat label="acurácia global" value={`${Math.round(acc * 100)}%`} tone="ink" />
        <Stat label="grupo A" value={`${Math.round(accA * 100)}%`} tone="emerald" />
        <Stat
          label="grupo B"
          value={`${Math.round(accB * 100)}%`}
          tone={accB < 0.8 ? 'rose' : 'emerald'}
        />
        <Stat
          label="diferença A − B"
          value={`${Math.round(gap * 100)} pp`}
          tone={gap > 0.1 ? 'rose' : 'ink'}
        />
      </Stats>

      {gap > 0.1 && (
        <div>
          <Badge tone="rose">
            a acurácia global esconde {Math.round(gap * 100)} pontos de diferença entre os grupos
          </Badge>
        </div>
      )}

      <Legend
        items={[
          { color: VIZ.d, label: 'rótulo verdadeiro 1' },
          { color: VIZ.e, label: 'rótulo verdadeiro 0' },
          { color: VIZ.c, label: 'erro do modelo' },
          { color: VIZ.a, label: 'fronteira aprendida' },
          { color: VIZ.muted, label: 'regra real', dashed: true },
        ]}
      />

      <Caption>
        Círculo é o grupo A, quadrado é o grupo B. A regra verdadeira é a mesma para os dois — a
        linha tracejada. O modelo nunca recebe a coluna de grupo, e mesmo assim a fronteira que ele
        aprende gruda no A e erra no B, porque foi quase só o A que ele viu. Repare que a acurácia
        global continua respeitável enquanto a do grupo B afunda: é exatamente esse número médio que
        costuma ir para o slide de aprovação do modelo.
      </Caption>
    </div>
  )
}
