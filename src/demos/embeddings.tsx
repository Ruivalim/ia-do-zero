import { useCallback, useMemo, useRef, useState } from 'react'
import { Btn, Caption, Grid, Legend, Plot, Row, Stat, Stats, Toggle, VIZ } from '../components/ui'
import { useSvgPointer } from '../lib/hooks'
import { cosine, euclid, fmt } from '../lib/mathx'

/* Espaço 2D onde significado é distância. Arraste palavras, fixe um par e rode a
   aritmética clássica rei − homem + mulher. */

const W = 520
const H = 320
const PAD = 28
const LO = -1.15
const HI = 1.15

type Word = { id: string; label: string; x: number; y: number; group: string }

const INITIAL: Word[] = [
  { id: 'rei', label: 'rei', x: 0.55, y: 0.72, group: 'realeza' },
  { id: 'rainha', label: 'rainha', x: 0.58, y: 0.38, group: 'realeza' },
  { id: 'homem', label: 'homem', x: 0.18, y: 0.68, group: 'realeza' },
  { id: 'mulher', label: 'mulher', x: 0.22, y: 0.35, group: 'realeza' },
  { id: 'cao', label: 'cão', x: -0.72, y: 0.55, group: 'animais' },
  { id: 'gato', label: 'gato', x: -0.55, y: 0.72, group: 'animais' },
  { id: 'cavalo', label: 'cavalo', x: -0.82, y: 0.28, group: 'animais' },
  { id: 'pao', label: 'pão', x: 0.72, y: -0.55, group: 'comida' },
  { id: 'queijo', label: 'queijo', x: 0.55, y: -0.72, group: 'comida' },
  { id: 'fruta', label: 'fruta', x: 0.88, y: -0.28, group: 'comida' },
  { id: 'codigo', label: 'código', x: -0.55, y: -0.68, group: 'tech' },
  { id: 'rede', label: 'rede', x: -0.72, y: -0.42, group: 'tech' },
  { id: 'token', label: 'token', x: -0.38, y: -0.82, group: 'tech' },
  { id: 'modelo', label: 'modelo', x: -0.88, y: -0.55, group: 'tech' },
  { id: 'coroa', label: 'coroa', x: 0.78, y: 0.55, group: 'realeza' },
  { id: 'leite', label: 'leite', x: 0.42, y: -0.48, group: 'comida' },
]

const GROUP_COLOR: Record<string, string> = {
  realeza: VIZ.b,
  animais: VIZ.d,
  comida: VIZ.c,
  tech: VIZ.a,
}

const toPx = (x: number) => PAD + ((x - LO) / (HI - LO)) * (W - 2 * PAD)
const toPy = (y: number) => H - PAD - ((y - LO) / (HI - LO)) * (H - 2 * PAD)
const fromPx = (px: number) => LO + ((px - PAD) / (W - 2 * PAD)) * (HI - LO)
const fromPy = (py: number) => LO + ((H - PAD - py) / (H - 2 * PAD)) * (HI - LO)

function nearest(words: Word[], target: { x: number; y: number }, exclude?: string) {
  let best = words[0]
  let bestD = Infinity
  for (const w of words) {
    if (w.id === exclude) continue
    const d = euclid([w.x, w.y], [target.x, target.y])
    if (d < bestD) {
      bestD = d
      best = w
    }
  }
  return best
}

export default function EmbeddingsDemo() {
  const [words, setWords] = useState(INITIAL)
  const [selected, setSelected] = useState<string[]>([])
  const [showRays, setShowRays] = useState(false)
  const [arith, setArith] = useState<{ x: number; y: number } | null>(null)
  const drag = useRef<string | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const toLocal = useSvgPointer(svgRef)

  const byId = useMemo(() => new Map(words.map((w) => [w.id, w])), [words])

  const pair =
    selected.length === 2 ? ([byId.get(selected[0])!, byId.get(selected[1])!] as const) : null
  const cos = pair ? cosine([pair[0].x, pair[0].y], [pair[1].x, pair[1].y]) : null
  const dist = pair ? euclid([pair[0].x, pair[0].y], [pair[1].x, pair[1].y]) : null

  const arithNearest = arith ? nearest(words, arith) : null

  const onPointerDown = useCallback((id: string, e: React.PointerEvent) => {
    e.preventDefault()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    drag.current = id
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 2) return [id]
      return [...prev, id]
    })
  }, [])

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drag.current) return
      const p = toLocal(e)
      const x = Math.max(LO + 0.05, Math.min(HI - 0.05, fromPx(p.x)))
      const y = Math.max(LO + 0.05, Math.min(HI - 0.05, fromPy(p.y)))
      setWords((ws) => ws.map((w) => (w.id === drag.current ? { ...w, x, y } : w)))
      setArith(null)
    },
    [toLocal],
  )

  const onPointerUp = () => {
    drag.current = null
  }

  const runArith = () => {
    const rei = byId.get('rei')!
    const homem = byId.get('homem')!
    const mulher = byId.get('mulher')!
    setArith({ x: rei.x - homem.x + mulher.x, y: rei.y - homem.y + mulher.y })
    setSelected(['rei', 'rainha'])
  }

  const origin = { x: toPx(0), y: toPy(0) }

  return (
    <div className="flex flex-col gap-4">
      <Row>
        <Btn onClick={runArith} variant="primary">
          rei − homem + mulher
        </Btn>
        <Btn
          onClick={() => {
            setWords(INITIAL)
            setSelected([])
            setArith(null)
          }}
          variant="danger"
        >
          Resetar
        </Btn>
        <span className="ml-auto" />
        <Toggle label="vetores desde a origem" checked={showRays} onChange={setShowRays} />
      </Row>

      <Plot
        w={W}
        h={H}
        svgRef={svgRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        aria-label="Espaço de embeddings em 2D"
      >
        <Grid w={W} h={H} step={40} />
        <line x1={PAD} y1={origin.y} x2={W - PAD} y2={origin.y} stroke={VIZ.axis} strokeWidth={1} />
        <line x1={origin.x} y1={PAD} x2={origin.x} y2={H - PAD} stroke={VIZ.axis} strokeWidth={1} />

        {(showRays || pair) &&
          words
            .filter((w) => showRays || selected.includes(w.id))
            .map((w) => (
              <line
                key={`r-${w.id}`}
                x1={origin.x}
                y1={origin.y}
                x2={toPx(w.x)}
                y2={toPy(w.y)}
                stroke={GROUP_COLOR[w.group]}
                strokeWidth={1.2}
                opacity={0.45}
              />
            ))}

        {pair && (
          <line
            x1={toPx(pair[0].x)}
            y1={toPy(pair[0].y)}
            x2={toPx(pair[1].x)}
            y2={toPy(pair[1].y)}
            stroke={VIZ.c}
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        )}

        {arith &&
          (() => {
            const rei = byId.get('rei')!
            const homem = byId.get('homem')!
            const mid = { x: rei.x - homem.x, y: rei.y - homem.y }
            return (
              <g>
                <line
                  x1={toPx(rei.x)}
                  y1={toPy(rei.y)}
                  x2={toPx(mid.x)}
                  y2={toPy(mid.y)}
                  stroke={VIZ.e}
                  strokeWidth={2}
                />
                <line
                  x1={toPx(mid.x)}
                  y1={toPy(mid.y)}
                  x2={toPx(arith.x)}
                  y2={toPy(arith.y)}
                  stroke={VIZ.b}
                  strokeWidth={2}
                />
                <circle
                  cx={toPx(arith.x)}
                  cy={toPy(arith.y)}
                  r={7}
                  fill={VIZ.c}
                  stroke={VIZ.ink}
                  strokeWidth={1.5}
                />
                <text
                  x={toPx(arith.x) + 10}
                  y={toPy(arith.y) + 4}
                  fill={VIZ.c}
                  fontSize={11}
                  fontWeight={600}
                >
                  resultado
                </text>
                {arithNearest && (
                  <line
                    x1={toPx(arith.x)}
                    y1={toPy(arith.y)}
                    x2={toPx(arithNearest.x)}
                    y2={toPy(arithNearest.y)}
                    stroke={VIZ.d}
                    strokeWidth={1.5}
                    strokeDasharray="3 2"
                  />
                )}
              </g>
            )
          })()}

        {words.map((w) => {
          const sel = selected.includes(w.id)
          const near = arithNearest?.id === w.id
          return (
            <g key={w.id} style={{ cursor: 'grab' }} onPointerDown={(e) => onPointerDown(w.id, e)}>
              {(sel || near) && (
                <circle
                  cx={toPx(w.x)}
                  cy={toPy(w.y)}
                  r={14}
                  fill="none"
                  stroke={near ? VIZ.d : VIZ.c}
                  strokeWidth={1.5}
                />
              )}
              <circle cx={toPx(w.x)} cy={toPy(w.y)} r={6} fill={GROUP_COLOR[w.group]} />
              <text
                x={toPx(w.x)}
                y={toPy(w.y) - 12}
                fill={VIZ.ink}
                fontSize={11}
                textAnchor="middle"
                className="select-none"
              >
                {w.label}
              </text>
            </g>
          )
        })}
      </Plot>

      <Stats>
        <Stat label="cosseno do par" value={cos === null ? '—' : fmt(cos)} tone="accent" />
        <Stat label="dist. euclidiana" value={dist === null ? '—' : fmt(dist)} />
        <Stat
          label="mais perto do resultado"
          value={arithNearest?.label ?? '—'}
          tone={arithNearest ? 'emerald' : 'ink'}
        />
        <Stat
          label="par fixado"
          value={pair ? `${pair[0].label} ↔ ${pair[1].label}` : 'clique em 2'}
        />
      </Stats>

      <Legend
        items={[
          { color: VIZ.b, label: 'realeza' },
          { color: VIZ.d, label: 'animais' },
          { color: VIZ.c, label: 'comida' },
          { color: VIZ.a, label: 'tecnologia' },
        ]}
      />

      <Caption>
        Clique em duas palavras para comparar. Cosseno mede o ângulo entre vetores e ignora o
        comprimento — por isso &quot;rei&quot; e &quot;rainha&quot; ficam parecidos mesmo se um
        vetor for mais longo. A aritmética rei − homem + mulher aponta para perto de rainha porque o
        deslocamento de gênero é aproximadamente o mesmo nos dois pares.
      </Caption>
    </div>
  )
}
