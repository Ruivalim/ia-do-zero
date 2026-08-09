import { useMemo, useState } from 'react'
import {
  Badge,
  Bar,
  Caption,
  Controls,
  Legend,
  Panel,
  Plot,
  Row,
  Slider,
  Stat,
  Stats,
  VIZ,
} from '../components/ui'
import { clamp, compact, fmt } from '../lib/mathx'

/* Leis de escala: a perda cai como lei de potência com compute, parâmetros e
   tokens. A curva desenhada é a fronteira ótima (L0 + A·C^-alpha, obtida com
   ~20 tokens por parâmetro); configurações fora dessa razão ficam acima dela.
   Constantes na ordem do ajuste de Hoffmann et al. 2022 (Chinchilla). */

const L0 = 1.69
const A_N = 406.4
const ALPHA_N = 0.34
const B_D = 410.7
const ALPHA_D = 0.28
const TOKENS_PER_PARAM = 20
const USD_PER_FLOP = 4e-18

const loss = (n: number, d: number) => L0 + A_N * n ** -ALPHA_N + B_D * d ** -ALPHA_D
const flops = (n: number, d: number) => 6 * n * d
const nOpt = (c: number) => Math.sqrt(c / (6 * TOKENS_PER_PARAM))
const frontierLoss = (c: number) => loss(nOpt(c), TOKENS_PER_PARAM * nOpt(c))

const W = 520
const H = 300
const PAD_L = 44
const PAD_R = 14
const PAD_T = 12
const PAD_B = 32
const LOG_LO = 15.5
const LOG_HI = 25.5
const Y_LO = 1.6
const Y_HI = 4.4

const toPx = (logC: number) => PAD_L + ((logC - LOG_LO) / (LOG_HI - LOG_LO)) * (W - PAD_L - PAD_R)
const toPy = (l: number) => PAD_T + (1 - (l - Y_LO) / (Y_HI - Y_LO)) * (H - PAD_T - PAD_B)

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹'
const pow10 = (e: number) =>
  `10${String(e)
    .split('')
    .map((c) => SUP[Number(c)])
    .join('')}`

/* Três jeitos de gastar o MESMO orçamento de compute. */
const C_BUDGET = flops(7e9, 1.4e11)
const BUDGET_CONFIGS = [
  { label: 'pequeno supertreinado', n: 7e8, color: VIZ.c },
  { label: 'médio (~20 tok/parâmetro)', n: 7e9, color: VIZ.d },
  { label: 'gigante subtreinado', n: 7e10, color: VIZ.e },
].map((cfg) => {
  const d = C_BUDGET / (6 * cfg.n)
  return { ...cfg, d, l: loss(cfg.n, d), ratio: d / cfg.n }
})
const MAX_EXCESS = Math.max(...BUDGET_CONFIGS.map((c) => c.l - L0))

export default function ScalingLawsDemo() {
  const [logN, setLogN] = useState(9)
  const [logD, setLogD] = useState(10.3)

  const n = 10 ** logN
  const d = 10 ** logD
  const c = flops(n, d)
  const l = loss(n, d)
  const ratio = d / n
  const cost = c * USD_PER_FLOP

  const curve = useMemo(() => {
    const pts: string[] = []
    for (let i = 0; i <= 90; i++) {
      const logC = LOG_LO + (i / 90) * (LOG_HI - LOG_LO)
      const y = clamp(frontierLoss(10 ** logC), Y_LO - 0.5, Y_HI + 0.5)
      pts.push(`${i === 0 ? 'M' : 'L'}${toPx(logC).toFixed(1)},${toPy(y).toFixed(1)}`)
    }
    return pts.join(' ')
  }, [])

  const status =
    ratio < 17
      ? {
          tone: 'amber' as const,
          text: `subtreinado — ${fmt(ratio, 1)} tokens/parâmetro, faltam dados`,
        }
      : ratio > 23
        ? {
            tone: 'amber' as const,
            text: `superdimensionado — ${fmt(ratio, 1)} tokens/parâmetro, modelo grande demais`,
          }
        : {
            tone: 'emerald' as const,
            text: `bem dimensionado — ~${fmt(ratio, 0)} tokens/parâmetro`,
          }

  const yTicks = [1.8, 2.2, 2.6, 3, 3.4, 3.8, 4.2]
  const xTicks = [16, 18, 20, 22, 24]
  const markerX = clamp(toPx(Math.log10(c)), PAD_L, W - PAD_R)
  const markerY = clamp(toPy(l), PAD_T, H - PAD_B)
  const frontierY = clamp(toPy(frontierLoss(c)), PAD_T, H - PAD_B)

  return (
    <div className="flex flex-col gap-4">
      <Row>
        <Badge tone={status.tone}>{status.text}</Badge>
      </Row>

      <Plot
        w={W}
        h={H}
        aria-label="Perda em função de compute em escala log-log, com a fronteira ótima e a configuração atual"
      >
        {yTicks.map((t) => (
          <g key={`y${t}`}>
            <line
              x1={PAD_L}
              y1={toPy(t)}
              x2={W - PAD_R}
              y2={toPy(t)}
              stroke={VIZ.grid}
              strokeWidth={1}
            />
            <text x={PAD_L - 6} y={toPy(t) + 3.5} fill={VIZ.axis} fontSize={10} textAnchor="end">
              {t.toFixed(1)}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <g key={`x${t}`}>
            <line
              x1={toPx(t)}
              y1={PAD_T}
              x2={toPx(t)}
              y2={H - PAD_B}
              stroke={VIZ.grid}
              strokeWidth={1}
            />
            <text x={toPx(t)} y={H - PAD_B + 16} fill={VIZ.axis} fontSize={10} textAnchor="middle">
              {pow10(t)}
            </text>
          </g>
        ))}
        <line
          x1={PAD_L}
          y1={H - PAD_B}
          x2={W - PAD_R}
          y2={H - PAD_B}
          stroke={VIZ.axis}
          strokeWidth={1}
        />
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={H - PAD_B} stroke={VIZ.axis} strokeWidth={1} />
        <text
          x={(PAD_L + W - PAD_R) / 2}
          y={H - 4}
          fill={VIZ.axis}
          fontSize={11}
          textAnchor="middle"
        >
          compute (FLOPs)
        </text>
        <text
          x={12}
          y={(PAD_T + H - PAD_B) / 2}
          fill={VIZ.axis}
          fontSize={11}
          textAnchor="middle"
          transform={`rotate(-90 12 ${(PAD_T + H - PAD_B) / 2})`}
        >
          perda
        </text>

        <path d={curve} fill="none" stroke={VIZ.a} strokeWidth={2.5} strokeLinecap="round" />

        {/* melhor perda possível com o mesmo compute */}
        <line
          x1={markerX}
          y1={markerY}
          x2={markerX}
          y2={frontierY}
          stroke={VIZ.b}
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
        <circle cx={markerX} cy={frontierY} r={5} fill={VIZ.b} />
        <circle cx={markerX} cy={markerY} r={7} fill={VIZ.c} stroke={VIZ.surface} strokeWidth={2} />
      </Plot>

      <Controls>
        <Slider
          label="parâmetros do modelo"
          value={logN}
          onChange={setLogN}
          min={6}
          max={12}
          step={0.1}
          format={(v) => compact(10 ** v)}
          hint="De 1M a 1T parâmetros (escala log)."
        />
        <Slider
          label="tokens de treino"
          value={logD}
          onChange={setLogD}
          min={7}
          max={13}
          step={0.1}
          format={(v) => compact(10 ** v)}
          hint="De 10M a 10T tokens (escala log)."
        />
      </Controls>

      <Stats>
        <Stat
          label="compute estimado"
          value={compact(c)}
          unit="FLOPs"
          hint="6 · parâmetros · tokens"
        />
        <Stat label="perda prevista" value={fmt(l, 3)} tone="accent" />
        <Stat
          label="tokens por parâmetro"
          value={fmt(ratio, 1)}
          tone={status.tone === 'amber' ? 'amber' : 'emerald'}
        />
        <Stat
          label="custo estimado"
          value={`$${compact(cost)}`}
          hint="Ordem de grandeza, não preço real"
        />
      </Stats>

      <Legend
        items={[
          { color: VIZ.a, label: 'fronteira ótima (~20 tok/parâmetro)' },
          { color: VIZ.c, label: 'sua configuração' },
          { color: VIZ.b, label: 'melhor perda com o mesmo compute' },
        ]}
      />

      <Panel title={`Mesmo orçamento: ${compact(C_BUDGET)} FLOPs, três divisões diferentes`}>
        <div className="flex flex-col gap-2">
          {BUDGET_CONFIGS.map((cfg) => (
            <Bar
              key={cfg.label}
              label={cfg.label}
              value={(cfg.l - L0) / MAX_EXCESS}
              color={cfg.color}
              right={fmt(cfg.l, 3)}
            />
          ))}
        </div>
        <Caption>
          Barra = perda acima do piso teórico; menor é melhor. O gigante só viu{' '}
          {fmt(BUDGET_CONFIGS[2].ratio, 1)} tokens por parâmetro — parâmetro sem dado não aprende.
        </Caption>
      </Panel>

      <Caption>
        A curva é previsível: dá para medir a perda de modelos pequenos e extrapolar para um treino
        de bilhões de dólares antes de gastar um centavo. Foi isso que justificou as apostas
        gigantes dos últimos anos. Mas ela é empírica, ajustada a dados — não é lei da natureza, e
        quebra se os dados acabarem ou a arquitetura mudar. O custo em dólar é só ordem de grandeza,
        não preço real.
      </Caption>
    </div>
  )
}
