import { useRef, useState } from 'react'
import {
  Badge,
  Bar,
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
import { usePrefersReducedMotion, useRaf } from '../lib/hooks'
import { clamp, compact, round } from '../lib/mathx'

/* LoRA: a matriz de pesos W fica congelada e o ajuste ΔW é aprendido como o
   produto de duas matrizes finas A (d×r) e B (r×d). O demo mostra o bloco d×d
   se abrindo nas duas fatias e quantifica por que isso é tão mais barato. */

const W = 520
const H = 320
const S = 170
const WX = 30
const QX = 320
const WY = 80
const GAP = 12

type Cenario = 'tom' | 'dominio' | 'idioma'

const RANK_SUGERIDO: Record<Cenario, number> = { tom: 4, dominio: 32, idioma: 64 }

const TEXTO_CENARIO: Record<Cenario, string> = {
  tom: 'Mudar tom de voz e estilo é uma correção pequena nos pesos — rank 4 costuma bastar.',
  dominio: 'Um domínio novo (jurídico, médico, código) pede mais capacidade de adaptação: rank 32.',
  idioma:
    'Idioma novo exige vocabulário e conhecimento que não cabem num ΔW de baixo rank — nem com rank máximo. A saída é pré-treino contínuo, não LoRA.',
}

function fmtBytes(bytes: number): string {
  if (bytes >= 1e9) return `${round(bytes / 1e9, 1)} GB`
  if (bytes >= 1e6) return `${round(bytes / 1e6, 1)} MB`
  if (bytes >= 1e3) return `${round(bytes / 1e3, 1)} kB`
  return `${Math.round(bytes)} B`
}

export default function LoraDemo() {
  const [dExp, setDExp] = useState(10) // d = 2^10 = 1024
  const [r, setR] = useState(4)
  const [cenario, setCenario] = useState<Cenario>('tom')
  const [playing, setPlaying] = useState(true)
  const [phase, setPhase] = useState(0.6)
  const dir = useRef(1)
  const reduced = usePrefersReducedMotion()

  const d = 2 ** dExp

  useRaf((dt) => {
    setPhase((p) => {
      let n = p + dir.current * dt * 0.45
      if (n >= 1) {
        n = 1
        dir.current = -1
      } else if (n <= 0) {
        n = 0
        dir.current = 1
      }
      return n
    })
  }, playing && !reduced)

  const t = phase * phase * (3 - 2 * phase)
  const slice = clamp((S * r) / d, 5, 48)
  const ax = QX - slice - GAP * t
  const by = WY - slice - GAP * t

  const paramsW = d * d
  const paramsLora = 2 * d * r
  const pct = (paramsLora / paramsW) * 100
  const pctStr = pct >= 1 ? `${round(pct, 1)}%` : `${pct.toPrecision(2)}%`
  const adamEconomizado = (paramsW - paramsLora) * 2 * 4 // 2 estados fp32 por parâmetro
  const capacidade = 1 - Math.exp(-r / 16)
  const rankAlto = r > 32

  const escolherCenario = (c: Cenario) => {
    setCenario(c)
    setR(RANK_SUGERIDO[c])
  }

  return (
    <div className="flex flex-col gap-4">
      <Row>
        <Choice
          label="O que você quer ensinar ao modelo?"
          value={cenario}
          onChange={escolherCenario}
          options={[
            { value: 'tom', label: 'Ajustar o tom de voz' },
            { value: 'dominio', label: 'Aprender um domínio novo' },
            { value: 'idioma', label: 'Ensinar um idioma novo' },
          ]}
        />
        <span className="ml-auto" />
        <Btn onClick={() => setPlaying((v) => !v)} variant="primary">
          {playing ? 'Pausar' : 'Animar'}
        </Btn>
      </Row>

      <Plot
        w={W}
        h={H}
        aria-label="Matriz de pesos W congelada se decompondo nas matrizes finas A e B do LoRA"
      >
        {/* W congelada */}
        <rect x={WX} y={WY} width={S} height={S} rx={4} fill={VIZ.b} opacity={0.18} />
        <rect
          x={WX}
          y={WY}
          width={S}
          height={S}
          rx={4}
          fill="none"
          stroke={VIZ.b}
          strokeWidth={2}
        />
        <text x={WX + S / 2} y={WY + S / 2 + 4} fill={VIZ.b} fontSize={14} textAnchor="middle">
          W
        </text>
        <text x={WX + S / 2} y={WY + S + 18} fill={VIZ.muted} fontSize={11} textAnchor="middle">
          {d}×{d} · congelada
        </text>

        <text
          x={(WX + S + QX) / 2}
          y={WY + S / 2 + 5}
          fill={VIZ.muted}
          fontSize={16}
          textAnchor="middle"
        >
          +
        </text>

        {/* ΔW = A·B */}
        <rect x={QX} y={WY} width={S} height={S} rx={4} fill={VIZ.b} opacity={0.18 * (1 - t)} />
        <rect
          x={QX}
          y={WY}
          width={S}
          height={S}
          rx={4}
          fill="none"
          stroke={VIZ.b}
          strokeWidth={1.5}
          strokeDasharray="5 4"
          opacity={0.9}
        />
        <text x={QX + S / 2} y={WY + S + 18} fill={VIZ.muted} fontSize={11} textAnchor="middle">
          ΔW = A·B
        </text>

        {/* fatias A (d×r) e B (r×d) deslizando para fora do bloco */}
        <g opacity={t}>
          <rect x={ax} y={WY} width={slice} height={S} rx={2} fill={VIZ.a} opacity={0.35} />
          <rect
            x={ax}
            y={WY}
            width={slice}
            height={S}
            rx={2}
            fill="none"
            stroke={VIZ.a}
            strokeWidth={2}
          />
          <text x={ax - 6} y={WY + S / 2 + 4} fill={VIZ.a} fontSize={12} textAnchor="end">
            A
          </text>

          <rect x={QX} y={by} width={S} height={slice} rx={2} fill={VIZ.a} opacity={0.35} />
          <rect
            x={QX}
            y={by}
            width={S}
            height={slice}
            rx={2}
            fill="none"
            stroke={VIZ.a}
            strokeWidth={2}
          />
          <text x={QX + S / 2} y={by - 6} fill={VIZ.a} fontSize={12} textAnchor="middle">
            B
          </text>
        </g>
      </Plot>

      <p className="text-sm text-muted">{TEXTO_CENARIO[cenario]}</p>

      <Controls>
        <Slider
          label="dimensão d"
          value={dExp}
          onChange={setDExp}
          min={6}
          max={12}
          format={(v) => String(2 ** v)}
          hint="Lado da matriz de pesos da camada — 4096 é típico num modelo de 7B."
        />
        <Slider
          label="rank r"
          value={r}
          onChange={setR}
          min={1}
          max={64}
          hint="Largura das fatias A e B. É o único custo que o LoRA paga."
        />
      </Controls>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Bar
            value={capacidade}
            color={rankAlto ? VIZ.c : VIZ.d}
            label="capacidade de adaptação"
            right={`${Math.round(capacidade * 100)}%`}
          />
        </div>
        {rankAlto && (
          <Badge tone="amber">rank alto: deixa de ser barato e volta a arriscar overfitting</Badge>
        )}
      </div>

      <Stats>
        <Stat label="parâmetros de W" value={compact(paramsW)} tone="violet" />
        <Stat label="treináveis (A·B)" value={compact(paramsLora)} tone="accent" />
        <Stat label="razão" value={pctStr} tone="emerald" hint="2·d·r ÷ d²" />
        <Stat
          label="Adam economizado"
          value={fmtBytes(adamEconomizado)}
          hint="O Adam guarda 2 estados (média e variância) por parâmetro treinável, em fp32"
        />
        <Stat
          label="tempo relativo de treino"
          value={`~${pctStr}`}
          tone="emerald"
          hint="Proporcional aos parâmetros treináveis; na prática um pouco mais, porque o forward passa por W inteira"
        />
      </Stats>

      <Caption>
        LoRA congela W e treina só A e B — por isso a razão de parâmetros despenca quando d cresce,
        enquanto a capacidade de adaptação satura rápido com r. O truque funciona porque a mudança
        útil numa camada costuma ser de baixo rank: quando ela não é (idioma novo), nenhuma fatia
        fina resolve e subir o rank só recria o custo e o overfitting do fine-tune completo.
      </Caption>
    </div>
  )
}
