import { useCallback, useMemo, useRef, useState } from 'react'
import { Bar, Btn, Caption, Grid, Plot, Row, Stat, Stats, VIZ } from '../components/ui'
import { useInterval, useSvgPointer } from '../lib/hooks'
import { clamp, fmt, gaussian, polyfit, rng } from '../lib/mathx'

/* A primeira ideia de aprendizado do curso: chutar uma reta, medir o erro
   (a área dos quadradinhos) e corrigir. O leitor arrasta as duas alças na
   mão; depois a máquina repete "errar → corrigir" 40 vezes e quase sempre
   termina com uma soma de áreas menor. */

const W = 520
const H = 320
const PAD = 36
const N = 12
const STEPS = 40
const LR = 0.5
const HX1 = 0.12 // posição x das duas alças, em coordenada de dados
const HX2 = 0.88

const toPx = (x: number) => PAD + x * (W - 2 * PAD)
const toPy = (y: number) => H - PAD - y * (H - 2 * PAD)
const fromPy = (py: number) => (H - PAD - py) / (H - 2 * PAD)

const DATA = (() => {
  const next = rng(11)
  return Array.from({ length: N }, (_, i) => {
    const x = 0.05 + (i / (N - 1)) * 0.9
    return { x, y: clamp(0.26 + 0.48 * x + gaussian(next, 0, 0.055), 0.06, 0.94) }
  })
})()

const FIT = polyfit(
  DATA.map((p) => p.x),
  DATA.map((p) => p.y),
  1,
) // [constante, inclinação]

type Line = { y1: number; y2: number } // altura da reta nas duas alças
const INITIAL: Line = { y1: 0.18, y2: 0.58 }

const toAB = (l: Line) => {
  const a = (l.y2 - l.y1) / (HX2 - HX1)
  return { a, b: l.y1 - a * HX1 }
}
const errOf = (a: number, b: number) => DATA.reduce((s, p) => s + (a * p.x + b - p.y) ** 2, 0)
const BEST = errOf(FIT[1], FIT[0])

export default function GuessAndCorrectDemo() {
  const [line, setLine] = useState<Line>(INITIAL)
  const [running, setRunning] = useState(false)
  const [steps, setSteps] = useState(0)
  const [frozen, setFrozen] = useState<number | null>(null) // seu erro quando a máquina assumiu
  const drag = useRef<0 | 1 | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const toSvg = useSvgPointer(svgRef)

  const { a, b } = toAB(line)
  const liveErr = errOf(a, b)
  const yourErr = frozen ?? liveErr
  const machineErr = steps > 0 ? liveErr : null
  const score = clamp(BEST / yourErr, 0, 1)

  const reset = () => {
    setRunning(false)
    setSteps(0)
    setFrozen(null)
  }

  /** Uma correção: mede quanto a reta erra em todos os pontos e ajusta um pouco. */
  const step = useCallback(() => {
    setLine((prev) => {
      const cur = toAB(prev)
      let ga = 0
      let gb = 0
      for (const p of DATA) {
        const r = cur.a * p.x + cur.b - p.y
        ga += r * p.x
        gb += r
      }
      const na = cur.a - (LR * 2 * ga) / N
      const nb = cur.b - (LR * 2 * gb) / N
      return { y1: clamp(na * HX1 + nb, -0.2, 1.2), y2: clamp(na * HX2 + nb, -0.2, 1.2) }
    })
    setSteps((s) => {
      if (s + 1 >= STEPS) setRunning(false)
      return s + 1
    })
  }, [])

  useInterval(step, 60, running)

  const handles = useMemo(
    () => [
      { px: toPx(HX1), py: toPy(line.y1) },
      { px: toPx(HX2), py: toPy(line.y2) },
    ],
    [line],
  )

  return (
    <div className="flex flex-col gap-4">
      <Row>
        <Btn
          variant="primary"
          onClick={() => {
            if (running) setRunning(false)
            else {
              if (steps === 0) setFrozen(liveErr)
              setRunning(true)
            }
          }}
        >
          {running ? 'Pausar' : steps > 0 ? 'Continuar' : 'Deixa comigo'}
        </Btn>
        <Btn
          variant="danger"
          onClick={() => {
            reset()
            setLine(INITIAL)
          }}
        >
          Zerar
        </Btn>
      </Row>

      <Plot
        w={W}
        h={H}
        svgRef={svgRef}
        aria-label="Pontos com uma reta ajustável; o erro de cada ponto aparece como um quadrado"
        onPointerDown={(e) => {
          const p = toSvg(e)
          let best: 0 | 1 | null = null
          let dist = 30
          handles.forEach((h, i) => {
            const d = Math.hypot(h.px - p.x, h.py - p.y)
            if (d < dist) {
              dist = d
              best = i as 0 | 1
            }
          })
          if (best === null) return
          e.currentTarget.setPointerCapture(e.pointerId)
          drag.current = best
          if (steps > 0) reset() // leitor reassume o controle da reta
        }}
        onPointerMove={(e) => {
          if (drag.current === null) return
          const v = clamp(fromPy(toSvg(e).y), 0, 1)
          setLine((prev) => (drag.current === 0 ? { ...prev, y1: v } : { ...prev, y2: v }))
        }}
        onPointerUp={() => {
          drag.current = null
        }}
      >
        <Grid w={W} h={H} step={48} />
        <defs>
          <clipPath id="gc-clip">
            <rect x={PAD} y={PAD - 20} width={W - 2 * PAD} height={H - 2 * PAD + 40} />
          </clipPath>
        </defs>

        {/* o erro de cada ponto: traço vertical + quadrado de lado = tamanho do erro */}
        {DATA.map((p, i) => {
          const px = toPx(p.x)
          const py = toPy(p.y)
          const ly = toPy(a * p.x + b)
          const side = Math.abs(py - ly)
          const dir = p.x > 0.55 ? -1 : 1
          return (
            <g key={i}>
              <rect
                x={dir > 0 ? px : px - side}
                y={Math.min(py, ly)}
                width={side}
                height={side}
                fill={VIZ.e}
                fillOpacity={0.14}
                stroke={VIZ.e}
                strokeOpacity={0.55}
                strokeWidth={1}
              />
              <line x1={px} y1={py} x2={px} y2={ly} stroke={VIZ.e} strokeWidth={1.5} />
            </g>
          )
        })}

        <g clipPath="url(#gc-clip)">
          <line
            x1={toPx(0)}
            y1={toPy(b)}
            x2={toPx(1)}
            y2={toPy(a + b)}
            stroke={steps > 0 ? VIZ.d : VIZ.a}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </g>

        {DATA.map((p, i) => (
          <circle key={i} cx={toPx(p.x)} cy={toPy(p.y)} r={5} fill={VIZ.b} opacity={0.9} />
        ))}

        {handles.map((h, i) => (
          <g key={i} style={{ cursor: 'grab' }}>
            <circle cx={h.px} cy={h.py} r={20} fill="transparent" />
            <circle
              cx={h.px}
              cy={h.py}
              r={9}
              fill={VIZ.surface}
              stroke={steps > 0 ? VIZ.d : VIZ.a}
              strokeWidth={3}
            />
          </g>
        ))}
        {steps === 0 && (
          <text x={handles[0].px + 14} y={handles[0].py - 14} fill={VIZ.muted} fontSize={11}>
            arraste pelas bolinhas
          </text>
        )}
      </Plot>

      <Bar
        label="seu placar"
        value={score}
        right={`${Math.round(score * 100)}%`}
        color={score > 0.95 ? VIZ.d : VIZ.a}
      />

      <Stats>
        <Stat label="seu erro" value={fmt(yourErr, 3)} tone="accent" />
        <Stat
          label="erro do algoritmo"
          value={machineErr === null ? '—' : fmt(machineErr, 3)}
          tone={machineErr === null ? 'ink' : machineErr <= yourErr ? 'emerald' : 'amber'}
        />
        <Stat label="passos" value={steps} />
        <Stat
          label="melhor possível"
          value={fmt(BEST, 3)}
          tone="violet"
          hint="O menor erro que uma reta consegue ter nesses pontos"
        />
      </Stats>

      <Caption>
        Cada quadradinho tem lado igual ao erro daquele ponto — o erro total é a soma das áreas.
        Errar o dobro num ponto pesa quatro vezes mais, então vale consertar primeiro os erros
        grandes. Aperte "Deixa comigo": a máquina faz {STEPS} correções seguidas, cada uma olhando
        todos os pontos ao mesmo tempo, e quase sempre fecha com área menor que a sua. O jeito de
        ganhar dela é caprichar na mão antes — com só {STEPS} passos, ela nem sempre termina de
        convergir.
      </Caption>
    </div>
  )
}
