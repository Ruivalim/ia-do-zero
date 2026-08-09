import { useMemo, useState } from 'react'
import {
  Badge,
  Btn,
  Caption,
  Controls,
  Legend,
  Plot,
  Row,
  Slider,
  Stat,
  Stats,
  Toggle,
  VIZ,
} from '../components/ui'
import { useInterval } from '../lib/hooks'
import { clamp, mean, rng } from '../lib/mathx'

/* Split treino/validação/teste. SIMULAÇÃO honesta: não existe modelo real aqui.
   As acurácias vêm de uma curva teórica — a habilidade verdadeira sobe com mais
   dados, o treino fica acima dela por memorização, o teste um pouco abaixo.
   Com vazamento, exemplos de teste são copiados para o treino e a nota de
   teste é inflada artificialmente. */

const N = 60
const COLS = 10
const CELL = 34
const GAP = 8
const W = 520
const GX = (W - (COLS * CELL + (COLS - 1) * GAP)) / 2
const K = 5
const LEAK_N = 5

const trueSkill = (nTreino: number) => 0.52 + 0.36 * Math.sqrt(nTreino / N)

function simulate(nTreino: number, leak: boolean, seed: number) {
  const next = rng(seed)
  const skill = trueSkill(nTreino)
  const treino = clamp(0.9 + 0.08 * (1 - nTreino / N) + next() * 0.02, 0, 1)
  const val = clamp(skill + (next() - 0.5) * 0.05, 0, 1)
  const teste = leak
    ? clamp(Math.min(0.99, skill + 0.13 + next() * 0.03), 0, 1) // nota inflada
    : clamp(skill - 0.02 + (next() - 0.5) * 0.04, 0, 1)
  return { treino, val, teste }
}

export default function DataSplitDemo() {
  const [pctTreino, setPctTreino] = useState(70)
  const [pctVal, setPctVal] = useState(15)
  const [leak, setLeak] = useState(false)
  const [cv, setCv] = useState(false)
  const [run, setRun] = useState(0)
  const [progress, setProgress] = useState(1)
  const [running, setRunning] = useState(false)

  const nTreino = Math.round((N * pctTreino) / 100)
  const nVal = Math.min(Math.round((N * pctVal) / 100), N - nTreino - 3)
  const nTeste = N - nTreino - nVal

  const seed = run * 7919 + nTreino * 131 + nVal * 17 + (leak ? 5 : 0)
  const res = useMemo(() => simulate(nTreino, leak, seed), [nTreino, leak, seed])

  const folds = useMemo(() => {
    const next = rng(4242 + nTreino)
    const base = trueSkill(nTreino)
    return Array.from({ length: K }, () => clamp(base + (next() - 0.5) * 0.09, 0, 1))
  }, [nTreino])
  const foldMean = mean(folds)
  const foldStd = Math.sqrt(mean(folds.map((f) => (f - foldMean) ** 2)))

  const leaked = useMemo(() => {
    const s = new Set<number>()
    if (!leak) return s
    const next = rng(31337)
    const total = Math.min(LEAK_N, nTeste)
    while (s.size < total) s.add(nTreino + nVal + Math.floor(next() * nTeste))
    return s
  }, [leak, nTreino, nVal, nTeste])

  useInterval(() => setProgress((p) => Math.min(1, p + 0.08)), 90, running && progress < 1)

  const instant = () => {
    setRunning(false)
    setProgress(1)
  }
  const trainAndEval = () => {
    setRun((r) => r + 1)
    setProgress(0)
    setRunning(true)
  }

  const training = progress < 1
  const pct = (v: number) => (training ? '…' : `${Math.round(v * 100)}%`)

  return (
    <div className="flex flex-col gap-4">
      <Row>
        <Btn
          variant="primary"
          onClick={training && running ? () => setRunning(false) : trainAndEval}
        >
          {training ? (running ? 'Pausar treino' : 'Continuar') : 'Treinar e avaliar'}
        </Btn>
        <Toggle
          label="vazamento de dados"
          checked={leak}
          onChange={(v) => {
            setLeak(v)
            if (v) setCv(false)
            instant()
          }}
        />
        <Toggle
          label="validação cruzada 5-fold"
          checked={cv}
          onChange={(v) => {
            setCv(v)
            if (v) setLeak(false)
            instant()
          }}
        />
        {leak && !training && (
          <Badge tone="rose">acurácia de teste inflada — essa nota é mentira</Badge>
        )}
      </Row>

      {!cv && (
        <Plot
          w={W}
          h={6 * CELL + 5 * GAP + 16}
          aria-label="Grade de 60 exemplos divididos entre treino, validação e teste"
        >
          {Array.from({ length: N }, (_, i) => {
            const x = GX + (i % COLS) * (CELL + GAP)
            const y = 8 + Math.floor(i / COLS) * (CELL + GAP)
            const kind = i < nTreino ? 0 : i < nTreino + nVal ? 1 : 2
            const isLeak = leaked.has(i)
            const pending = kind === 0 && training && i / nTreino > progress
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={CELL}
                  height={CELL}
                  rx={5}
                  fill={[VIZ.a, VIZ.c, VIZ.b][kind]}
                  opacity={pending ? 0.12 : kind === 0 ? 0.9 : 0.7}
                  stroke={isLeak ? VIZ.e : 'none'}
                  strokeWidth={isLeak ? 3 : 0}
                />
                {isLeak && (
                  <text
                    x={x + CELL / 2}
                    y={y + CELL / 2 + 5}
                    textAnchor="middle"
                    fontSize={14}
                    fill={VIZ.e}
                  >
                    ×2
                  </text>
                )}
              </g>
            )
          })}
        </Plot>
      )}

      {cv && (
        <Plot
          w={W}
          h={258}
          aria-label="Validação cruzada em 5 folds, cada um com um quinto dos dados como validação"
        >
          {folds.map((acc, i) => {
            const y = 10 + i * 44
            const bw = (W - 160 - (K - 1) * 6) / K
            return (
              <g key={i}>
                <text x={10} y={y + 21} fontSize={12} fill={VIZ.axis}>
                  fold {i + 1}
                </text>
                {Array.from({ length: K }, (_, j) => (
                  <rect
                    key={j}
                    x={64 + j * (bw + 6)}
                    y={y}
                    width={bw}
                    height={30}
                    rx={4}
                    fill={j === i ? VIZ.c : VIZ.a}
                    opacity={j === i ? 0.95 : 0.45}
                  />
                ))}
                <text x={W - 8} y={y + 21} textAnchor="end" fontSize={13} fill={VIZ.muted}>
                  {pct(acc)}
                </text>
              </g>
            )
          })}
          <text x={64} y={252} fontSize={13} fill={VIZ.ink}>
            média {pct(foldMean)} ± {training ? '…' : `${Math.round(foldStd * 100)} pontos`}
          </text>
        </Plot>
      )}

      <Controls>
        <Slider
          label="% treino"
          value={pctTreino}
          min={30}
          max={90}
          format={(v) => `${v}%`}
          onChange={(v) => {
            setPctTreino(v)
            setPctVal((pv) => Math.min(pv, 95 - v))
            instant()
          }}
        />
        <Slider
          label="% validação"
          value={pctVal}
          min={5}
          max={95 - pctTreino}
          format={(v) => `${v}%`}
          hint="O teste é o que sobra."
          onChange={(v) => {
            setPctVal(v)
            instant()
          }}
        />
      </Controls>

      {!cv && (
        <Stats>
          <Stat label="treino" value={nTreino} unit="ex." tone="accent" />
          <Stat label="validação" value={nVal} unit="ex." tone="amber" />
          <Stat label="teste" value={nTeste} unit="ex." tone="violet" />
          {leak && (
            <Stat
              label="vazados"
              value={leaked.size}
              tone="rose"
              hint="Exemplos de teste copiados para o treino"
            />
          )}
          <Stat label="acc. treino" value={pct(res.treino)} />
          <Stat label="acc. validação" value={pct(res.val)} />
          <Stat label="acc. teste" value={pct(res.teste)} tone={leak ? 'rose' : 'emerald'} />
        </Stats>
      )}

      {cv && (
        <Stats>
          <Stat label="média dos folds" value={pct(foldMean)} tone="accent" />
          <Stat
            label="desvio entre folds"
            value={training ? '…' : `${Math.round(foldStd * 100)} p.p.`}
            tone="amber"
          />
          <Stat label="melhor fold" value={pct(Math.max(...folds))} tone="emerald" />
          <Stat label="pior fold" value={pct(Math.min(...folds))} tone="rose" />
        </Stats>
      )}

      {!cv && (
        <Legend
          items={[
            { color: VIZ.a, label: 'treino' },
            { color: VIZ.c, label: 'validação' },
            { color: VIZ.b, label: 'teste' },
            ...(leak ? [{ color: VIZ.e, label: 'vazado (duplicado no treino)' }] : []),
          ]}
        />
      )}

      <Caption>
        Regra de ouro: o conjunto de teste só se toca uma vez, no fim, para estimar como o modelo se
        sai no mundo real — validação é para decidir, teste é para medir. Ligue o vazamento e veja a
        nota de teste saltar sem o modelo melhorar nada: é o erro mais comum e mais invisível do
        ofício, porque nenhum número denuncia que ele aconteceu. O 5-fold responde outra pergunta:
        quanto da nota é sorte do sorteio — se o desvio entre folds é grande, a acurácia única
        estava te contando só parte da história.
      </Caption>
    </div>
  )
}
