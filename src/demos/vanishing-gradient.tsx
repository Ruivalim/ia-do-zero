import { useState } from 'react'
import {
  Btn,
  Caption,
  Choice,
  Controls,
  Legend,
  Plot,
  Row,
  Slider,
  Stat,
  Stats,
  VIZ,
} from '../components/ui'
import { useRaf } from '../lib/hooks'
import { clamp, remap, round } from '../lib/mathx'

/* Why RNNs forget: the signal from step 1 is multiplied by the recurrent
   eigenvalue at every step. Below 1 it vanishes, above 1 it explodes.
   The LSTM routes it through the cell state; the Transformer skips the
   chain entirely and connects every pair of tokens in one hop. */

const W = 520
const H = 320
const N = 20
const PADX = 14
const CW = (W - 2 * PADX) / N
const CHAIN_Y = 250
const CELL_H = 30
const LOG_MIN = -7
const LOG_MAX = 4.2
const BAR_MIN = 4
const BAR_MAX = 148
const WORDS =
  'o gato preto que morava na casa da rua de trás comeu todo o peixe que estava na mesa ontem'.split(
    ' ',
  )

type Mode = 'rnn' | 'lstm' | 'transformer'

const cx = (i: number) => PADX + (i + 0.5) * CW
const barH = (d: number, eff: number) =>
  remap(clamp(d * Math.log10(eff), LOG_MIN, LOG_MAX), LOG_MIN, LOG_MAX, BAR_MIN, BAR_MAX)

const SUP: Record<string, string> = {
  '-': '⁻',
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
}
function sci(v: number): string {
  if (v === 0) return '0'
  const e = Math.floor(Math.log10(Math.abs(v)))
  if (e >= -2 && e <= 2) return String(round(v, e === 0 ? 3 : 2))
  const sup = [...String(e)].map((c) => SUP[c]).join('')
  return `${round(v / 10 ** e, 1)}×10${sup}`
}

export default function VanishingGradientDemo() {
  const [mode, setMode] = useState<Mode>('rnn')
  const [fator, setFator] = useState(0.9)
  const [running, setRunning] = useState(true)
  const [t, setT] = useState(0)

  useRaf((dt) => setT((v) => (v + dt * 4.5) % 24), running)
  const pulse = Math.min(t, N - 1)

  const eff = mode === 'rnn' ? fator : mode === 'lstm' ? 0.995 : 1
  const surv = eff ** (N - 1)
  let maxUseful = 0
  for (let d = 0; d < N; d++) {
    const s = eff ** d
    if (s >= 0.01 && s <= 100) maxUseful = d
  }
  const col =
    mode === 'transformer' ? VIZ.b : eff >= 0.99 && eff <= 1.01 ? VIZ.d : eff < 1 ? VIZ.a : VIZ.e
  const comport = eff < 0.99 ? 'desvanece' : eff > 1.01 ? 'explode' : 'estável'

  const pSig = eff ** pulse
  const pR = clamp(3.2 * pSig ** 0.22, 1.3, 20)

  return (
    <div className="flex flex-col gap-4">
      <Row>
        <Choice
          value={mode}
          onChange={setMode}
          options={[
            {
              value: 'rnn',
              label: 'RNN simples',
              title: 'O sinal é multiplicado pelo fator a cada passo',
            },
            { value: 'lstm', label: 'LSTM', title: 'A cell state carrega o sinal quase intacto' },
            {
              value: 'transformer',
              label: 'Transformer',
              title: 'Attention liga todo token a todo token em um passo',
            },
          ]}
        />
        <span className="ml-auto" />
        <Btn variant="primary" onClick={() => setRunning((v) => !v)}>
          {running ? 'Pausar' : 'Animar'}
        </Btn>
      </Row>

      <Plot
        w={W}
        h={H}
        aria-label="Cadeia de 20 passos mostrando quanto do sinal do primeiro token sobrevive até o último"
      >
        {[-2, 2].map((l) => {
          const y = CHAIN_Y - remap(l, LOG_MIN, LOG_MAX, BAR_MIN, BAR_MAX)
          return (
            <g key={l}>
              <line
                x1={PADX}
                y1={y}
                x2={W - PADX}
                y2={y}
                stroke={VIZ.axis}
                strokeWidth={1}
                strokeDasharray="4 4"
                opacity={0.55}
              />
              <text x={PADX + 2} y={y - 3} fill={VIZ.axis} fontSize={8}>
                {l === -2 ? '1%' : '100×'}
              </text>
            </g>
          )
        })}

        {WORDS.map((_, i) => {
          const h = barH(N - 1 - i, eff)
          return (
            <rect
              key={i}
              x={cx(i) - CW * 0.26}
              y={CHAIN_Y - h}
              width={CW * 0.52}
              height={h}
              fill={col}
              opacity={0.75}
              rx={1.5}
            />
          )
        })}

        {mode === 'lstm' && (
          <>
            <polyline
              points={WORDS.map((_, i) => `${cx(i)},${CHAIN_Y - barH(N - 1 - i, eff) - 5}`).join(
                ' ',
              )}
              fill="none"
              stroke={VIZ.d}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <text
              x={W - PADX}
              y={CHAIN_Y - barH(0, eff) - 12}
              fill={VIZ.d}
              fontSize={9}
              textAnchor="end"
            >
              cell state
            </text>
          </>
        )}

        {mode === 'transformer' &&
          WORDS.map((_, j) =>
            j === 0 ? null : (
              <path
                key={j}
                d={`M ${cx(0)} ${CHAIN_Y} Q ${(cx(0) + cx(j)) / 2} ${CHAIN_Y - 118 - j * 3} ${cx(j)} ${CHAIN_Y}`}
                fill="none"
                stroke={VIZ.b}
                strokeWidth={1.2}
                opacity={0.35}
              />
            ),
          )}

        {WORDS.map((w, i) => (
          <g key={i}>
            <rect
              x={cx(i) - CW / 2 + 1}
              y={CHAIN_Y}
              width={CW - 2}
              height={CELL_H}
              rx={4}
              fill={VIZ.surface}
              stroke={VIZ.border}
            />
            <text
              x={cx(i)}
              y={CHAIN_Y + CELL_H / 2 + 2.5}
              fill={VIZ.muted}
              fontSize={6.5}
              textAnchor="middle"
            >
              {w}
            </text>
          </g>
        ))}
        <text x={cx(0)} y={CHAIN_Y + CELL_H + 13} fill={VIZ.axis} fontSize={8} textAnchor="middle">
          passo 1
        </text>
        <text
          x={cx(N - 1)}
          y={CHAIN_Y + CELL_H + 13}
          fill={VIZ.axis}
          fontSize={8}
          textAnchor="middle"
        >
          passo {N}
        </text>

        <circle
          cx={cx(pulse)}
          cy={CHAIN_Y - barH(pulse, eff) - pR - 4}
          r={pR}
          fill={col}
          opacity={0.85}
        />
      </Plot>

      <Controls cols={1}>
        <Slider
          label="fator por passo (autovalor da recorrência)"
          value={fator}
          onChange={setFator}
          min={0.5}
          max={1.5}
          step={0.01}
          format={(v) => v.toFixed(2)}
          disabled={mode !== 'rnn'}
          hint={
            mode === 'rnn'
              ? 'Abaixo de 1 o sinal desvanece; acima, explode.'
              : 'A LSTM e o Transformer não dependem desse fator.'
          }
        />
      </Controls>

      <Stats>
        <Stat
          label={`sinal após ${N - 1} passos`}
          value={sci(surv)}
          tone={surv < 0.01 || surv > 100 ? 'rose' : 'emerald'}
          hint="Quanto do primeiro token ainda chega ao último"
        />
        <Stat
          label="distância útil"
          value={maxUseful}
          unit="passos"
          hint="Até onde o sinal fica entre 1% e 100×"
        />
        <Stat
          label="caminho mais longo"
          value={mode === 'transformer' ? '1' : String(N - 1)}
          unit="passos"
          tone={mode === 'transformer' ? 'emerald' : 'amber'}
          hint="Entre o primeiro e o último token"
        />
        <Stat
          label="comportamento"
          value={comport}
          tone={comport === 'estável' ? 'emerald' : 'rose'}
        />
      </Stats>

      <Legend
        items={[
          { color: VIZ.a, label: 'sinal que desvanece' },
          { color: VIZ.e, label: 'sinal que explode' },
          { color: VIZ.d, label: 'sinal preservado' },
          { color: VIZ.axis, label: 'faixa útil', dashed: true },
        ]}
      />

      <Caption>
        No RNN simples o sinal do primeiro token é multiplicado pelo fator a cada passo: com 0,9
        sobram uns 14% depois de 19 passos, com 0,5 praticamente nada — e acima de 1 ele explode. A
        LSTM desvia pela cell state e chega quase inteira. No Transformer, qualquer par de tokens
        está a um passo de distância graças à attention: é essa a vantagem, não “mais parâmetros”.
      </Caption>
    </div>
  )
}
