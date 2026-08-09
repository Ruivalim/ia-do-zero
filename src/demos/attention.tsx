import { useMemo, useState } from 'react'
import { Caption, Choice, Controls, Plot, Row, Stat, Stats, Toggle, VIZ } from '../components/ui'
import { entropy, softmax } from '../lib/mathx'

const W = 620
const H = 310
type PhraseId = 'gato' | 'ana' | 'robo'
type Head = 'sintática' | 'anterior' | 'difusa'
const PHRASES: Record<PhraseId, { tokens: string[]; parents: number[] }> = {
  gato: {
    tokens: ['O', 'gato', 'não', 'coube', 'na', 'caixa', 'porque', 'ela', 'era', 'pequena'],
    parents: [1, 3, 3, 3, 5, 3, 3, 5, 7, 7],
  },
  ana: {
    tokens: ['Ana', 'avisou', 'Maria', 'que', 'ela', 'perderia', 'o', 'trem', 'cedo'],
    parents: [1, 1, 1, 5, 2, 1, 7, 5, 5],
  },
  robo: {
    tokens: ['O', 'robô', 'pegou', 'a', 'chave', 'e', 'depois', 'a', 'guardou'],
    parents: [1, 2, 2, 4, 2, 2, 8, 4, 2],
  },
}

function logitsFor(n: number, parents: number[], head: Head) {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (head === 'sintática')
        return j === parents[i] ? 3.4 : j === i ? 1.5 : -0.35 * Math.abs(i - j)
      if (head === 'anterior')
        return j === Math.max(0, i - 1) ? 3 : j === i ? 1.1 : -0.55 * Math.abs(i - j)
      return 0.5 * Math.cos((i + 1) * (j + 2)) - 0.08 * Math.abs(i - j)
    }),
  )
}

export default function AttentionDemo() {
  const [phraseId, setPhraseId] = useState<PhraseId>('gato')
  const [head, setHead] = useState<Head>('sintática')
  const [causal, setCausal] = useState(false)
  const [selected, setSelected] = useState(7)
  const phrase = PHRASES[phraseId]
  const weights = useMemo(
    () =>
      logitsFor(phrase.tokens.length, phrase.parents, head).map((row, i) =>
        softmax(row.map((v, j) => (causal && j > i ? -1e9 : v))),
      ),
    [causal, head, phrase],
  )
  const n = phrase.tokens.length
  const cell = Math.min(24, 238 / n)
  const ox = 92
  const oy = 38
  const row = weights[Math.min(selected, n - 1)]
  const maxWeight = Math.max(...weights.flat())
  const averageEntropy = weights.reduce((s, values) => s + entropy(values), 0) / n
  const columns = Array.from({ length: n }, (_, j) =>
    weights.reduce((s, values) => s + values[j], 0),
  )
  const most = columns.indexOf(Math.max(...columns))
  const tokenX = (i: number) => 32 + (i * (W - 64)) / Math.max(1, n - 1)

  return (
    <div className="flex flex-col gap-4">
      <Row>
        <Choice
          value={phraseId}
          onChange={(v) => {
            setPhraseId(v)
            setSelected(v === 'gato' ? 7 : 4)
          }}
          options={[
            { value: 'gato', label: 'Gato e caixa' },
            { value: 'ana', label: 'Ana e Maria' },
            { value: 'robo', label: 'Robô e chave' },
          ]}
        />
        <Choice
          value={head}
          onChange={setHead}
          options={[
            { value: 'sintática', label: 'Sintática' },
            { value: 'anterior', label: 'Anterior' },
            { value: 'difusa', label: 'Difusa' },
          ]}
        />
      </Row>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Plot w={W} h={H} aria-label="Matriz de self-attention">
          {weights.flatMap((values, i) =>
            values.map((value, j) => (
              <g key={`${i}-${j}`}>
                <rect
                  x={ox + j * cell}
                  y={oy + i * cell}
                  width={cell - 1}
                  height={cell - 1}
                  fill={VIZ.a}
                  opacity={0.04 + value * 0.92}
                  onClick={() => setSelected(i)}
                />
                <title>{`${phrase.tokens[i]} → ${phrase.tokens[j]}: ${value.toFixed(2)}`}</title>
              </g>
            )),
          )}
          {phrase.tokens.map((token, i) => (
            <g key={token + i}>
              <text
                x={ox - 7}
                y={oy + i * cell + cell * 0.67}
                textAnchor="end"
                fill={i === selected ? VIZ.a : VIZ.muted}
                fontSize={9}
              >
                {token}
              </text>
              <text
                transform={`translate(${ox + i * cell + cell * 0.65} ${oy - 7}) rotate(-55)`}
                textAnchor="start"
                fill={VIZ.muted}
                fontSize={9}
              >
                {token}
              </text>
            </g>
          ))}
        </Plot>
        <Plot w={W} h={H} aria-label="Ligações de atenção do token selecionado">
          {row.map(
            (weight, j) =>
              weight > 0.06 &&
              j !== selected && (
                <path
                  key={j}
                  d={`M ${tokenX(selected)} 245 Q ${(tokenX(selected) + tokenX(j)) / 2} ${235 - Math.abs(selected - j) * 16} ${tokenX(j)} 245`}
                  fill="none"
                  stroke={VIZ.a}
                  strokeWidth={1 + weight * 11}
                  opacity={0.35 + weight}
                />
              ),
          )}
          {phrase.tokens.map((token, i) => (
            <g
              key={token + i}
              onMouseEnter={() => setSelected(i)}
              onClick={() => setSelected(i)}
              className="cursor-pointer"
            >
              <circle
                cx={tokenX(i)}
                cy={250}
                r={i === selected ? 14 : 10}
                fill={i === selected ? VIZ.a : VIZ.surface}
                stroke={i === selected ? VIZ.a : VIZ.border}
              />
              <text
                x={tokenX(i)}
                y={280 + (i % 2) * 13}
                textAnchor="middle"
                fill={i === selected ? VIZ.a : VIZ.ink}
                fontSize={10}
              >
                {token}
              </text>
            </g>
          ))}
          <text x={W / 2} y={28} textAnchor="middle" fill={VIZ.muted} fontSize={11}>
            atenção puxada por “{phrase.tokens[selected]}”
          </text>
        </Plot>
      </div>
      <Controls cols={1}>
        <Toggle label="máscara causal" checked={causal} onChange={setCausal} />
      </Controls>
      <Stats>
        <Stat label="entropia média" value={averageEntropy.toFixed(2)} />
        <Stat label="maior peso" value={maxWeight.toFixed(2)} tone="accent" />
        <Stat label="token mais atendido" value={phrase.tokens[most]} tone="violet" />
      </Stats>
      <Caption>
        As três cabeças procuram relações diferentes. A máscara causal impede olhar tokens futuros e
        renormaliza cada linha. Os pesos são ilustrativos, definidos à mão; não são medições de um
        modelo real.
      </Caption>
    </div>
  )
}
