import { useMemo, useState } from 'react'
import { Caption, Choice, Controls, Grid, Legend, Plot, Stat, Stats, VIZ } from '../components/ui'
import { clamp, euclid, gaussian, remap, rng, round } from '../lib/mathx'

/* The same 24 fruits seen through different pairs of features. Color and
   roughness separate apples from oranges perfectly; weight and shelf days
   carry no signal at all. A leave-one-out KNN (k=3) on the two chosen axes
   makes the difference measurable instead of anecdotal. */

const W = 520
const H = 320
const PAD = 46

type FeatKey = 'peso' | 'diametro' | 'cor' | 'rugosidade' | 'dias'
type Fruit = Record<FeatKey, number> & { label: 'maçã' | 'laranja' }

const FEATS: Record<FeatKey, { nome: string; unit: string; lo: number; hi: number }> = {
  peso: { nome: 'peso', unit: 'g', lo: 60, hi: 240 },
  diametro: { nome: 'diâmetro', unit: 'cm', lo: 5, hi: 11 },
  cor: { nome: 'cor', unit: '0=verde, 1=vermelho', lo: 0, hi: 1 },
  rugosidade: { nome: 'rugosidade', unit: '0–1', lo: 0, hi: 1 },
  dias: { nome: 'dias na prateleira', unit: 'dias', lo: 0, hi: 12 },
}
const FEAT_KEYS: FeatKey[] = ['peso', 'diametro', 'cor', 'rugosidade', 'dias']

function makeData(): Fruit[] {
  const next = rng(8)
  const out: Fruit[] = []
  for (let i = 0; i < 24; i++) {
    const maca = i % 2 === 0
    out.push({
      peso: round(gaussian(next, 150, 30)),
      diametro: round(gaussian(next, 8, 0.9), 1),
      cor: clamp(round(gaussian(next, maca ? 0.85 : 0.3, 0.06), 2), 0, 1),
      rugosidade: clamp(round(gaussian(next, maca ? 0.18 : 0.82, 0.07), 2), 0, 1),
      dias: Math.max(0, Math.round(gaussian(next, 6, 2.5))),
      label: maca ? 'maçã' : 'laranja',
    })
  }
  return out
}

/** Leave-one-out accuracy of a 3-NN using only the two chosen features. */
function knnLoo(data: Fruit[], fx: FeatKey, fy: FeatKey) {
  const ax = FEATS[fx]
  const ay = FEATS[fy]
  const pt = (f: Fruit): [number, number] => [
    (f[fx] - ax.lo) / (ax.hi - ax.lo),
    (f[fy] - ay.lo) / (ay.hi - ay.lo),
  ]
  let erros = 0
  for (let i = 0; i < data.length; i++) {
    const p = pt(data[i])
    const vizinhos = data
      .map((f, j) => ({ j, d: j === i ? Infinity : euclid(p, pt(f)) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 3)
    const macas = vizinhos.filter((v) => data[v.j].label === 'maçã').length
    if ((macas >= 2 ? 'maçã' : 'laranja') !== data[i].label) erros++
  }
  return { acc: 1 - erros / data.length, erros }
}

export default function FeatureSpaceDemo() {
  const [fx, setFx] = useState<FeatKey>('peso')
  const [fy, setFy] = useState<FeatKey>('dias')

  const data = useMemo(makeData, [])
  const { acc, erros } = useMemo(() => knnLoo(data, fx, fy), [data, fx, fy])

  const ax = FEATS[fx]
  const ay = FEATS[fy]
  const px = (v: number) => PAD + remap(clamp(v, ax.lo, ax.hi), ax.lo, ax.hi, 0, W - 2 * PAD)
  const py = (v: number) => H - PAD - remap(clamp(v, ay.lo, ay.hi), ay.lo, ay.hi, 0, H - 2 * PAD)

  const options = FEAT_KEYS.map((k) => ({ value: k, label: FEATS[k].nome }))

  return (
    <div className="flex flex-col gap-4">
      <Controls cols={2}>
        <Choice label="eixo X" value={fx} options={options} onChange={setFx} />
        <Choice label="eixo Y" value={fy} options={options} onChange={setFy} />
      </Controls>

      <Plot
        w={W}
        h={H}
        aria-label={`Dispersão de ${ax.nome} por ${ay.nome} das 24 frutas, coloridas pelo rótulo`}
      >
        <Grid w={W} h={H} step={48} />
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke={VIZ.axis} strokeWidth={1} />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke={VIZ.axis} strokeWidth={1} />
        <text x={W - PAD} y={H - PAD + 20} fill={VIZ.axis} fontSize={11} textAnchor="end">
          {ax.nome} ({ax.unit})
        </text>
        <text x={PAD - 10} y={PAD - 8} fill={VIZ.axis} fontSize={11} textAnchor="start">
          {ay.nome} ({ay.unit})
        </text>
        {data.map((f, i) => (
          <circle
            key={i}
            cx={px(f[fx])}
            cy={py(f[fy])}
            r={6.5}
            fill={f.label === 'maçã' ? VIZ.d : VIZ.c}
            opacity={0.85}
            stroke={VIZ.surface}
            strokeWidth={1}
          />
        ))}
      </Plot>

      <Stats>
        <Stat
          label="separabilidade"
          value={`${Math.round(acc * 100)}%`}
          tone={acc === 1 ? 'emerald' : acc >= 0.75 ? 'amber' : 'rose'}
          hint="Acurácia de um KNN k=3 leave-one-out usando só as duas features dos eixos"
        />
        <Stat label="erros no LOO" value={erros} tone={erros === 0 ? 'emerald' : 'rose'} />
        <Stat label="exemplos" value={data.length} />
        <Stat label="features" value={FEAT_KEYS.length} hint="O dataset inteiro tem 5 colunas" />
      </Stats>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left font-mono text-xs whitespace-nowrap">
          <thead>
            <tr className="border-b border-line bg-surface-2 text-faint">
              <th className="px-3 py-2 font-medium">peso (g)</th>
              <th className="px-3 py-2 font-medium">diâmetro (cm)</th>
              <th className="px-3 py-2 font-medium">cor</th>
              <th className="px-3 py-2 font-medium">rugosidade</th>
              <th className="px-3 py-2 font-medium">dias</th>
              <th className="px-3 py-2 font-medium">rótulo</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 6).map((f, i) => (
              <tr key={i} className="border-b border-line last:border-0">
                <td className="px-3 py-1.5 text-muted">{f.peso}</td>
                <td className="px-3 py-1.5 text-muted">{f.diametro}</td>
                <td className="px-3 py-1.5 text-muted">{f.cor.toFixed(2)}</td>
                <td className="px-3 py-1.5 text-muted">{f.rugosidade.toFixed(2)}</td>
                <td className="px-3 py-1.5 text-muted">{f.dias}</td>
                <td className={`px-3 py-1.5 ${f.label === 'maçã' ? 'text-emerald' : 'text-amber'}`}>
                  {f.label}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Legend
        items={[
          { color: VIZ.d, label: 'maçã' },
          { color: VIZ.c, label: 'laranja' },
        ]}
      />

      <Caption>
        Com peso × dias os pontos das duas frutas se misturam e o KNN erra metade — essas features
        não carregam informação sobre o rótulo. Troque os eixos para cor × rugosidade: as nuvens se
        separam sem encostar uma na outra e a separabilidade vai a 100%. É por isso que escolher
        feature boa vale mais do que escolher modelo sofisticado.
      </Caption>
    </div>
  )
}
