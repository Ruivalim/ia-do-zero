import { useMemo, useState } from 'react'
import { Caption, Controls, Panel, Plot, Slider, Stat, Stats, VIZ } from '../components/ui'
import { compact, fmt } from '../lib/mathx'

/* Anatomia de um bloco Transformer: clique numa peça para ver tensor e parâmetros. */

const W = 280
const H = 360

type Piece = 'entrada' | 'ln1' | 'mha' | 'res1' | 'ln2' | 'mlp' | 'res2' | 'saida'

const PIECES: {
  id: Piece
  label: string
  y: number
  h: number
  kind: 'io' | 'norm' | 'attn' | 'mlp' | 'res'
  desc: string
  shapeIn: (d: number, n: number) => string
  shapeOut: (d: number, n: number) => string
  params: (d: number, heads: number) => number
}[] = [
  {
    id: 'entrada',
    label: 'entrada',
    y: 12,
    h: 28,
    kind: 'io',
    desc: 'Sequência de embeddings após o embedding de tokens + posicional.',
    shapeIn: (d, n) => `[B, ${n}, ${d}]`,
    shapeOut: (d, n) => `[B, ${n}, ${d}]`,
    params: () => 0,
  },
  {
    id: 'ln1',
    label: 'LayerNorm',
    y: 48,
    h: 28,
    kind: 'norm',
    desc: 'Normaliza cada token na dimensão d_model. Estabiliza o treino sem misturar tokens.',
    shapeIn: (d, n) => `[B, ${n}, ${d}]`,
    shapeOut: (d, n) => `[B, ${n}, ${d}]`,
    params: (d) => 2 * d,
  },
  {
    id: 'mha',
    label: 'Multi-Head Attention',
    y: 84,
    h: 44,
    kind: 'attn',
    desc: 'Cada token olha os outros via Q·Kᵀ e mistura valores. Várias cabeças em paralelo.',
    shapeIn: (d, n) => `[B, ${n}, ${d}]`,
    shapeOut: (d, n) => `[B, ${n}, ${d}]`,
    params: (d) => 4 * d * d,
  },
  {
    id: 'res1',
    label: 'soma residual',
    y: 136,
    h: 24,
    kind: 'res',
    desc: 'Soma a entrada do sub-bloco com a saída da attention. Mantém o gradiente vivo.',
    shapeIn: (d, n) => `[B, ${n}, ${d}] + [B, ${n}, ${d}]`,
    shapeOut: (d, n) => `[B, ${n}, ${d}]`,
    params: () => 0,
  },
  {
    id: 'ln2',
    label: 'LayerNorm',
    y: 168,
    h: 28,
    kind: 'norm',
    desc: 'Segunda normalização, antes do MLP. Mesma forma de tensor, parâmetros próprios.',
    shapeIn: (d, n) => `[B, ${n}, ${d}]`,
    shapeOut: (d, n) => `[B, ${n}, ${d}]`,
    params: (d) => 2 * d,
  },
  {
    id: 'mlp',
    label: 'MLP (4× → d)',
    y: 204,
    h: 44,
    kind: 'mlp',
    desc: 'Expande para 4·d, aplica não-linearidade e volta a d. É onde fica a maior parte dos parâmetros.',
    shapeIn: (d, n) => `[B, ${n}, ${d}]`,
    shapeOut: (d, n) => `[B, ${n}, ${d}]`,
    params: (d) => 8 * d * d,
  },
  {
    id: 'res2',
    label: 'soma residual',
    y: 256,
    h: 24,
    kind: 'res',
    desc: 'Segundo atalho residual: entrada do MLP + saída do MLP.',
    shapeIn: (d, n) => `[B, ${n}, ${d}] + [B, ${n}, ${d}]`,
    shapeOut: (d, n) => `[B, ${n}, ${d}]`,
    params: () => 0,
  },
  {
    id: 'saida',
    label: 'saída do bloco',
    y: 292,
    h: 28,
    kind: 'io',
    desc: 'Mesma forma da entrada. Pronto para o próximo bloco ou para a cabeça de saída.',
    shapeIn: (d, n) => `[B, ${n}, ${d}]`,
    shapeOut: (d, n) => `[B, ${n}, ${d}]`,
    params: () => 0,
  },
]

const KIND_FILL: Record<string, string> = {
  io: VIZ.f,
  norm: VIZ.c,
  attn: VIZ.a,
  mlp: VIZ.b,
  res: VIZ.d,
}

const D_OPTS = [128, 256, 512, 768, 1024, 2048, 4096]
const SEQ = 128

export default function TransformerBlocksDemo() {
  const [dIdx, setDIdx] = useState(3)
  const [heads, setHeads] = useState(12)
  const [layers, setLayers] = useState(12)
  const [active, setActive] = useState<Piece>('mha')

  const d = D_OPTS[dIdx]
  const piece = PIECES.find((p) => p.id === active)!

  const blockParams = useMemo(() => {
    // attention ≈ 4 d², MLP ≈ 8 d², LayerNorms ≈ 4d
    return 4 * d * d + 8 * d * d + 4 * d
  }, [d])

  const totalParams = blockParams * layers
  const mlpShare = (8 * d * d) / blockParams
  const dHead = d / Math.max(1, heads)
  const pieceParams = piece.params(d, heads)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,280px)_1fr]">
        <Plot w={W} h={H} aria-label="Diagrama de um bloco Transformer">
          {PIECES.map((p, i) => {
            if (i > 0) {
              const prev = PIECES[i - 1]
              const y0 = prev.y + prev.h
              const y1 = p.y
              return (
                <line
                  key={`c-${p.id}`}
                  x1={W / 2}
                  y1={y0}
                  x2={W / 2}
                  y2={y1}
                  stroke={VIZ.axis}
                  strokeWidth={1.5}
                />
              )
            }
            return null
          })}
          {PIECES.map((p) => {
            const sel = p.id === active
            const x = 40
            const bw = W - 80
            return (
              <g key={p.id} style={{ cursor: 'pointer' }} onClick={() => setActive(p.id)}>
                <rect
                  x={x}
                  y={p.y}
                  width={bw}
                  height={p.h}
                  rx={6}
                  fill={KIND_FILL[p.kind]}
                  opacity={sel ? 0.35 : 0.14}
                  stroke={sel ? KIND_FILL[p.kind] : VIZ.border}
                  strokeWidth={sel ? 2 : 1}
                />
                <text
                  x={W / 2}
                  y={p.y + p.h / 2 + 4}
                  textAnchor="middle"
                  fill={VIZ.ink}
                  fontSize={12}
                  fontWeight={sel ? 600 : 400}
                >
                  {p.label}
                </text>
              </g>
            )
          })}
          {/* residual side arrows */}
          <path
            d={`M 28 56 L 22 56 L 22 148 L 40 148`}
            fill="none"
            stroke={VIZ.d}
            strokeWidth={1.2}
            opacity={0.7}
          />
          <path
            d={`M 28 176 L 18 176 L 18 268 L 40 268`}
            fill="none"
            stroke={VIZ.d}
            strokeWidth={1.2}
            opacity={0.7}
          />
        </Plot>

        <Panel title={piece.label}>
          <p className="mb-3 text-sm leading-relaxed text-muted">{piece.desc}</p>
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex justify-between gap-2">
              <span className="text-faint">entra</span>
              <span className="text-ink">{piece.shapeIn(d, SEQ)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-faint">sai</span>
              <span className="text-ink">{piece.shapeOut(d, SEQ)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-faint">parâmetros</span>
              <span className="text-accent">{compact(pieceParams)}</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-faint">
            Fórmulas por bloco: attention ≈ 4·d² · MLP ≈ 8·d² · LayerNorm ≈ 2·d cada.
          </p>
        </Panel>
      </div>

      {/* stacked blocks mini diagram */}
      <div className="overflow-x-auto">
        <div className="flex items-center gap-1 min-w-0">
          <span className="shrink-0 text-xs text-faint">×{layers}</span>
          {Array.from({ length: Math.min(layers, 16) }, (_, i) => (
            <div
              key={i}
              className="h-8 flex-1 min-w-3 rounded border border-accent/40 bg-accent/10"
              title={`bloco ${i + 1}`}
            />
          ))}
          {layers > 16 && <span className="text-xs text-faint">…</span>}
        </div>
      </div>

      <Controls cols={3}>
        <Slider
          label="d_model"
          value={dIdx}
          onChange={setDIdx}
          min={0}
          max={D_OPTS.length - 1}
          step={1}
          format={() => String(d)}
        />
        <Slider label="cabeças" value={heads} onChange={setHeads} min={1} max={64} step={1} />
        <Slider label="camadas" value={layers} onChange={setLayers} min={1} max={96} step={1} />
      </Controls>

      <Stats>
        <Stat label="params / bloco" value={compact(blockParams)} tone="accent" />
        <Stat label="params totais" value={compact(totalParams)} />
        <Stat
          label="dim / cabeça"
          value={Number.isInteger(dHead) ? dHead : fmt(dHead, 1)}
          tone={Number.isInteger(dHead) ? 'ink' : 'amber'}
          hint={
            !Number.isInteger(dHead) ? 'd_model deve ser divisível pelo nº de cabeças' : undefined
          }
        />
        <Stat label="% no MLP" value={`${Math.round(mlpShare * 100)}%`} tone="violet" />
      </Stats>

      <Caption>
        Clique nas peças do bloco. O MLP leva cerca de 2/3 dos parâmetros (8d² vs 4d² da attention).
        Empilhar N camadas multiplica o total — um modelo com d=4096 e 32 camadas já está na casa
        dos bilhões só nos blocos.
      </Caption>
    </div>
  )
}
