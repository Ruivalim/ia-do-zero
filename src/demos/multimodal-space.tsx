import { useMemo, useState } from 'react'
import {
  Bar,
  Caption,
  Grid,
  Legend,
  Panel,
  Plot,
  Row,
  Stat,
  Stats,
  Toggle,
  VIZ,
} from '../components/ui'
import { clamp, cosine, fmt, gaussian, rng } from '../lib/mathx'

/* Espaço de embeddings multimodal em miniatura: 10 imagens desenhadas à mão e
   10 legendas com vetores latentes declarados no código. No modo alinhado o
   treino contrastivo já aconteceu — cada texto está perto da sua imagem e a
   busca por cosine acerta. No modo "espaços separados" os vetores de imagem
   sofrem uma permutação fixa (os dois encoders nunca se falaram) e o ranking
   quebra: o par correto cai para posição de acaso. */

const W = 520
const H = 320
const DIM = 10

type Item = { cap: string; keys: string[]; img: [number, number] }

const ITEMS: Item[] = [
  { cap: 'um gato preto', keys: ['gato', 'gata'], img: [44, 46] },
  { cap: 'cachorro no parque', keys: ['cachorro', 'cao', 'dog'], img: [200, 44] },
  { cap: 'carro vermelho', keys: ['carro', 'carros'], img: [330, 46] },
  { cap: 'bicicleta no muro', keys: ['bicicleta', 'bike'], img: [44, 128] },
  { cap: 'praia com sol', keys: ['praia', 'mar', 'sol'], img: [210, 128] },
  { cap: 'montanhas nevadas', keys: ['montanha', 'montanhas', 'neve'], img: [340, 128] },
  { cap: 'prédios da cidade', keys: ['cidade', 'predio', 'predios'], img: [44, 210] },
  { cap: 'gráfico de barras', keys: ['grafico', 'barras', 'dados'], img: [230, 210] },
  { cap: 'bolo de chocolate', keys: ['bolo', 'chocolate'], img: [392, 210] },
  { cap: 'café quente', keys: ['cafe', 'xicara'], img: [44, 288] },
]

function makeLatents(seed: number, sd: number): number[][] {
  const next = rng(seed)
  return ITEMS.map((_, i) =>
    Array.from({ length: DIM }, (_, d) => (d === i ? 1 : 0) + gaussian(next, 0, sd)),
  )
}
const IMG_LAT = makeLatents(11, 0.12)
const TXT_LAT = makeLatents(23, 0.12)

const chipW = (s: string) => s.length * 5.1 + 14
const TXT_ALIGN = ITEMS.map(
  (it) => [it.img[0] + 20 + chipW(it.cap) / 2, it.img[1]] as [number, number],
)

const scatter = rng(7)
const SEP_IMG = ITEMS.map(() => [56 + scatter() * 80, 40 + scatter() * 240] as [number, number])
const SEP_TXT = ITEMS.map(() => [372 + scatter() * 78, 40 + scatter() * 240] as [number, number])

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

function Thumb({ kind }: { kind: number }) {
  const c = [VIZ.a, VIZ.b, VIZ.e, VIZ.d, VIZ.f, VIZ.b, VIZ.f, VIZ.a, VIZ.e, VIZ.c][kind]
  switch (kind) {
    case 0:
      return (
        <>
          <path d="M-6,-1 L-9,-11 L-1,-6 Z M6,-1 L9,-11 L1,-6 Z" fill={c} />
          <circle cy="3" r="8" fill={c} />
        </>
      )
    case 1:
      return (
        <>
          <ellipse cx="-8" cy="-3" rx="3.5" ry="7" fill={c} />
          <circle r="8" fill={c} />
          <circle cx="5" cy="3" r="4" fill={VIZ.surface} />
        </>
      )
    case 2:
      return (
        <>
          <rect x="-7" y="-9" width="14" height="7" rx="2.5" fill={c} />
          <rect x="-12" y="-3" width="24" height="8" rx="3" fill={c} />
          <circle cx="-6" cy="7" r="3.2" fill={VIZ.ink} />
          <circle cx="6" cy="7" r="3.2" fill={VIZ.ink} />
        </>
      )
    case 3:
      return (
        <>
          <circle cx="-7" cy="5" r="5" fill="none" stroke={c} strokeWidth="2" />
          <circle cx="8" cy="5" r="5" fill="none" stroke={c} strokeWidth="2" />
          <path d="M-7,5 L-1,-4 L8,5 M-4,-8 L-1,-4 L3,-4" stroke={c} strokeWidth="2" fill="none" />
        </>
      )
    case 4:
      return (
        <>
          <circle cx="-4" cy="-5" r="4.5" fill={VIZ.c} />
          <path
            d="M-12,4 Q-6,-1 0,4 T12,4"
            stroke={c}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M-12,9 Q-6,4 0,9 T12,9"
            stroke={c}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.55"
          />
        </>
      )
    case 5:
      return (
        <>
          <path d="M-12,9 L-2,-9 L8,9 Z" fill={c} />
          <path d="M2,9 L8,-1 L13,9 Z" fill={c} opacity="0.6" />
          <path d="M-5,-3 L-2,-9 L1,-3 L-2,-1 Z" fill={VIZ.surface} />
        </>
      )
    case 6:
      return (
        <>
          <rect x="-12" y="-2" width="7" height="12" fill={c} />
          <rect x="-3" y="-10" width="7" height="20" fill={c} opacity="0.75" />
          <rect x="6" y="-5" width="7" height="15" fill={c} opacity="0.5" />
        </>
      )
    case 7:
      return (
        <>
          <line x1="-11" y1="9" x2="12" y2="9" stroke={VIZ.axis} strokeWidth="1.5" />
          <rect x="-10" y="2" width="5" height="7" fill={c} />
          <rect x="-3" y="-3" width="5" height="12" fill={c} />
          <rect x="4" y="-8" width="5" height="17" fill={c} />
        </>
      )
    case 8:
      return (
        <>
          <rect x="-10" y="0" width="20" height="10" rx="2" fill={c} />
          <rect x="-10" y="0" width="20" height="3.5" rx="1.5" fill={VIZ.c} />
          <line x1="0" y1="0" x2="0" y2="-7" stroke={VIZ.ink} strokeWidth="1.5" />
          <circle cy="-9" r="1.8" fill={VIZ.c} />
        </>
      )
    default:
      return (
        <>
          <rect x="-8" y="-2" width="14" height="11" rx="3" fill={c} />
          <path d="M6,0 Q12,1 6,6" stroke={c} strokeWidth="2" fill="none" />
          <path
            d="M-4,-5 Q-3,-8 -4,-11 M1,-5 Q2,-8 1,-11"
            stroke={VIZ.muted}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )
  }
}

export default function MultimodalSpaceDemo() {
  const [split, setSplit] = useState(false)
  const [sel, setSel] = useState<{ kind: 't' | 'i'; idx: number }>({ kind: 't', idx: 4 })
  const [query, setQuery] = useState('')

  const imgVec = useMemo(
    () => (j: number) => (split ? [...IMG_LAT[j]].reverse() : IMG_LAT[j]),
    [split],
  )

  const sims = useMemo(
    () =>
      ITEMS.map((_, j) =>
        sel.kind === 't'
          ? cosine(TXT_LAT[sel.idx], imgVec(j))
          : cosine(TXT_LAT[j], imgVec(sel.idx)),
      ),
    [sel, imgVec],
  )

  const order = useMemo(() => [...sims.keys()].sort((a, b) => sims[b] - sims[a]), [sims])
  const match = order[0]
  const rank = order.indexOf(sel.idx) + 1

  const top1 = useMemo(() => {
    let hits = 0
    for (let i = 0; i < ITEMS.length; i++) {
      let best = 0
      for (let j = 1; j < ITEMS.length; j++)
        if (cosine(TXT_LAT[i], imgVec(j)) > cosine(TXT_LAT[i], imgVec(best))) best = j
      if (best === i) hits++
    }
    return hits
  }, [imgVec])

  const onQuery = (v: string) => {
    setQuery(v)
    const words = normalize(v)
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
    const idx = ITEMS.findIndex((it) => it.keys.some((k) => words.includes(k)))
    if (idx >= 0) setSel({ kind: 't', idx })
  }

  const imgPos = (i: number): [number, number] => (split ? SEP_IMG[i] : ITEMS[i].img)
  const txtPos = (i: number): [number, number] => (split ? SEP_TXT[i] : TXT_ALIGN[i])
  const from = sel.kind === 't' ? txtPos(sel.idx) : imgPos(sel.idx)
  const to = sel.kind === 't' ? imgPos(match) : txtPos(match)
  const ok = match === sel.idx
  const move = (x: number, y: number) =>
    ({ transform: `translate(${x}px, ${y}px)`, transition: 'transform 450ms ease' }) as const

  return (
    <div className="flex flex-col gap-4">
      <Row>
        <Toggle
          label="espaços separados (sem treino contrastivo)"
          checked={split}
          onChange={setSplit}
        />
      </Row>

      <input
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder="busque por texto: praia, gato, gráfico, café…"
        aria-label="Busca por texto no espaço de embeddings"
        className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-faint focus:border-accent/60"
      />

      <Plot w={W} h={H} aria-label="Espaço de embeddings com miniaturas de imagens e legendas">
        <Grid w={W} h={H} step={52} />
        <text x={12} y={H - 10} fill={VIZ.axis} fontSize={10}>
          {split ? 'dois encoders que nunca se falaram' : 'espaço de embeddings compartilhado'}
        </text>
        {split && (
          <>
            <text x={96} y={22} fill={VIZ.axis} fontSize={10} textAnchor="middle">
              imagens
            </text>
            <text x={412} y={22} fill={VIZ.axis} fontSize={10} textAnchor="middle">
              textos
            </text>
          </>
        )}

        <line
          x1={from[0]}
          y1={from[1]}
          x2={to[0]}
          y2={to[1]}
          stroke={ok ? VIZ.d : VIZ.e}
          strokeWidth={2}
          strokeDasharray="5 4"
        />

        {ITEMS.map((it, i) => {
          const [x, y] = imgPos(i)
          const isMatch = sel.kind === 't' && i === match
          const isSel = sel.kind === 'i' && i === sel.idx
          return (
            <g key={`img${i}`} style={move(x, y)}>
              {(isMatch || isSel) && (
                <circle
                  r={16}
                  fill="none"
                  stroke={isMatch ? (ok ? VIZ.d : VIZ.e) : VIZ.c}
                  strokeWidth={2}
                />
              )}
              <Thumb kind={i} />
              <rect
                x={-18}
                y={-18}
                width={36}
                height={36}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onClick={() => setSel({ kind: 'i', idx: i })}
              >
                <title>{it.cap}</title>
              </rect>
            </g>
          )
        })}

        {ITEMS.map((it, i) => {
          const [x, y] = txtPos(i)
          const w = chipW(it.cap)
          const isMatch = sel.kind === 'i' && i === match
          const isSel = sel.kind === 't' && i === sel.idx
          const stroke = isMatch ? (ok ? VIZ.d : VIZ.e) : isSel ? VIZ.c : VIZ.border
          return (
            <g key={`txt${i}`} style={move(x, y)}>
              <rect
                x={-w / 2}
                y={-9}
                width={w}
                height={18}
                rx={9}
                fill={VIZ.surface}
                stroke={stroke}
                strokeWidth={isMatch || isSel ? 2 : 1}
              />
              <text y={3.5} fill={VIZ.ink} fontSize={9.5} textAnchor="middle">
                {it.cap}
              </text>
              <rect
                x={-Math.max(w, 36) / 2}
                y={-16}
                width={Math.max(w, 36)}
                height={32}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onClick={() => setSel({ kind: 't', idx: i })}
              />
            </g>
          )
        })}
      </Plot>

      <Panel title={`ranking por cosine — “${ITEMS[sel.idx].cap}”`}>
        <div className="flex flex-col gap-1.5">
          {order.slice(0, 3).map((j, k) => (
            <Bar
              key={j}
              label={ITEMS[j].cap}
              value={clamp((sims[j] + 0.2) / 1.2, 0, 1)}
              right={fmt(sims[j])}
              highlight={k === 0}
              color={j === sel.idx ? VIZ.d : k === 0 ? VIZ.e : VIZ.muted}
            />
          ))}
        </div>
      </Panel>

      <Stats>
        <Stat
          label="similaridade do par"
          value={fmt(sims[sel.idx])}
          tone={sims[sel.idx] > 0.5 ? 'emerald' : 'rose'}
        />
        <Stat
          label="par correto no ranking"
          value={`#${rank}`}
          tone={rank === 1 ? 'emerald' : 'rose'}
        />
        <Stat
          label="acertos top-1"
          value={`${top1}/10`}
          tone={top1 >= 8 ? 'emerald' : top1 >= 4 ? 'amber' : 'rose'}
        />
      </Stats>

      <Legend
        items={[
          { color: VIZ.d, label: 'par correto', dashed: true },
          { color: VIZ.e, label: 'par errado', dashed: true },
        ]}
      />

      <Caption>
        Clique numa legenda para ver qual imagem o cosine escolhe, ou numa imagem para o inverso — e
        experimente a busca livre. Esta é a ideia inteira do CLIP: o treino contrastivo puxa o par
        certo para perto e empurra os errados para longe, então texto acha imagem. Ligue “espaços
        separados” para ver o mundo sem esse treino: os dois aglomerados não se falam, a busca
        acerta ao acaso e o top-1 desaba para ~1/10.
      </Caption>
    </div>
  )
}
