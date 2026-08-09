import { useMemo, useState } from 'react'
import {
  Badge,
  Caption,
  Choice,
  Controls,
  Panel,
  SERIES,
  Slider,
  Stat,
  Stats,
  VIZ,
} from '../components/ui'
import { cosine, fmt, rng } from '../lib/mathx'

/* RAG passo a passo: chunking ruim quebra a resposta. */

const DOC = `A Cooperativa Vale Verde cultiva café arábica em três fazendas no sul de Minas. A safra de 2024 produziu 12.400 sacas, sendo 4.100 na Fazenda Alto da Serra, 5.200 na Fazenda Ribeirão e 3.100 na Fazenda Boa Vista. O preço médio de venda foi R$ 1.280 por saca, o que gerou receita bruta de aproximadamente R$ 15,9 milhões. Cerca de 62% da produção foi exportada para a Europa, 25% ficou no mercado interno e o restante foi estocado. A cooperativa mantém um laboratório de prova com 4 Q-graders e classifica 100% dos lotes antes do embarque. O custo médio de produção ficou em R$ 920 por saca, incluindo mão de obra, insumos e transporte até o armazém. A meta de 2025 é reduzir o custo em 8% com irrigação por gotejamento na Fazenda Alto da Serra. O projeto de irrigação exige investimento de R$ 2,1 milhões e payback estimado em 3 anos. A diretoria aprovou o orçamento em março, com desembolso em duas parcelas: 60% na assinatura do contrato e 40% na entrega dos equipamentos. O fornecedor escolhido foi a empresa IrrigaSul, com garantia de 5 anos nas bombas. Além do café, a cooperativa testa plantio experimental de cacau em 18 hectares da Boa Vista, com colheita prevista só em 2027. Os associados votam o relatório anual em assembleia toda primeira sexta de junho.`

type Q = { id: string; label: string; text: string; need: string[]; answer: string }

const QUESTIONS: Q[] = [
  {
    id: 'preco',
    label: 'preço médio',
    text: 'Qual foi o preço médio de venda por saca em 2024?',
    need: ['1.280'],
    answer: 'O preço médio de venda foi R$ 1.280 por saca.',
  },
  {
    id: 'split',
    label: 'investimento partido',
    text: 'Qual o investimento total do projeto de irrigação e em quantas parcelas?',
    // answer spans: "investimento de R$ 2,1 milhões" and "desembolso em duas parcelas"
    need: ['2,1', 'duas parcelas'],
    answer: 'Investimento de R$ 2,1 milhões, em duas parcelas (60% + 40%).',
  },
  {
    id: 'export',
    label: 'exportação',
    text: 'Que percentual da produção foi exportado para a Europa?',
    need: ['62%'],
    answer: 'Cerca de 62% da produção foi exportada para a Europa.',
  },
]

function chunkText(text: string, size: number, overlapPct: number): string[] {
  const step = Math.max(1, Math.round(size * (1 - overlapPct / 100)))
  const out: string[] = []
  for (let i = 0; i < text.length; i += step) {
    out.push(text.slice(i, i + size))
    if (i + size >= text.length) break
  }
  return out
}

/** 8-d pseudo-embedding from bag-of-words hash — illustrative only */
function embed(text: string): number[] {
  const next = rng([...text.toLowerCase()].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7))
  const v = Array.from({ length: 8 }, () => next() * 2 - 1)
  // boost dimensions by keyword presence for demo coherence
  const t = text.toLowerCase()
  if (t.includes('preço') || t.includes('1.280') || t.includes('1280')) v[0] += 1.2
  if (t.includes('investimento') || t.includes('2,1') || t.includes('irrigação')) v[1] += 1.2
  if (t.includes('parcelas') || t.includes('desembolso') || t.includes('60%')) v[2] += 1.2
  if (t.includes('export') || t.includes('62%') || t.includes('europa')) v[3] += 1.2
  if (t.includes('safra') || t.includes('sacas') || t.includes('fazenda')) v[4] += 0.6
  if (t.includes('custo') || t.includes('920')) v[5] += 0.8
  if (t.includes('cacau') || t.includes('2027')) v[6] += 0.9
  if (t.includes('assembleia') || t.includes('diretoria')) v[7] += 0.5
  return v
}

export default function RagPipelineDemo() {
  const [chunkSize, setChunkSize] = useState(120)
  const [overlap, setOverlap] = useState(10)
  const [qid, setQid] = useState(QUESTIONS[1].id)
  const [k, setK] = useState(2)

  const chunks = useMemo(() => chunkText(DOC, chunkSize, overlap), [chunkSize, overlap])

  const q = QUESTIONS.find((x) => x.id === qid)!
  const qVec = useMemo(() => embed(q.text), [q])

  const ranked = useMemo(() => {
    return chunks
      .map((text, i) => ({ i, text, vec: embed(text), sim: cosine(qVec, embed(text)) }))
      .sort((a, b) => b.sim - a.sim)
  }, [chunks, qVec])

  const top = ranked.slice(0, k)
  const context = top.map((t) => t.text).join('\n---\n')
  const inContext = q.need.every((n) => context.toLowerCase().includes(n.toLowerCase()))
  const bestSim = ranked[0]?.sim ?? 0
  const recoveredTok = Math.round(context.length / 3.6)

  const answer = inContext
    ? q.answer
    : 'Com base nos trechos recuperados, não há informação suficiente para responder com segurança.'

  // document color bands
  let offset = 0
  const bands = chunks.map((c, i) => {
    const start = offset
    // approximate without full overlap accounting for display
    const len = c.length
    offset = Math.min(DOC.length, offset + Math.max(1, Math.round(chunkSize * (1 - overlap / 100))))
    return { i, start, len, text: c }
  })

  return (
    <div className="flex flex-col gap-4">
      <Controls cols={3}>
        <Slider
          label="tamanho do chunk"
          value={chunkSize}
          onChange={setChunkSize}
          min={50}
          max={400}
          step={10}
        />
        <Slider
          label="sobreposição"
          value={overlap}
          onChange={setOverlap}
          min={0}
          max={50}
          step={5}
          format={(v) => `${v}%`}
        />
        <Slider label="top-k" value={k} onChange={setK} min={1} max={5} step={1} />
      </Controls>

      <Panel title="1 · documento fatiado">
        <div className="flex flex-wrap gap-0.5 text-[11px] leading-snug">
          {bands.map((b) => {
            const isTop = top.some((t) => t.i === b.i)
            return (
              <span
                key={b.i}
                className="rounded px-0.5"
                style={{
                  background: SERIES[b.i % SERIES.length],
                  opacity: isTop ? 0.35 : 0.12,
                  outline: isTop ? `1px solid ${VIZ.c}` : undefined,
                }}
                title={`chunk ${b.i + 1}`}
              >
                {b.text}
              </span>
            )
          })}
        </div>
      </Panel>

      <Panel title="2 · vetores simulados (8D)">
        <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
          {ranked.slice(0, 6).map((r) => (
            <div key={r.i} className="flex items-center gap-2">
              <span className="w-14 shrink-0 font-mono text-[10px] text-faint">#{r.i + 1}</span>
              <div className="flex flex-1 gap-0.5">
                {r.vec.map((v, j) => (
                  <div
                    key={j}
                    className="h-3 flex-1 rounded-sm"
                    style={{
                      background: v > 0 ? VIZ.a : VIZ.e,
                      opacity: 0.2 + Math.min(0.8, Math.abs(v) * 0.3),
                    }}
                  />
                ))}
              </div>
              <span className="w-12 text-right font-mono text-[10px] text-muted">{fmt(r.sim)}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Choice
        label="3 · pergunta"
        value={qid}
        onChange={setQid}
        options={QUESTIONS.map((x) => ({ value: x.id, label: x.label, title: x.text }))}
      />

      <Panel title="4 · prompt + resposta">
        <p className="mb-2 text-xs text-muted">{q.text}</p>
        <pre className="mb-2 max-h-28 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-faint">
          {`Contexto:\n${context.slice(0, 400)}${context.length > 400 ? '…' : ''}\n\nPergunta: ${q.text}`}
        </pre>
        <div className="flex items-start gap-2">
          <Badge tone={inContext ? 'emerald' : 'rose'}>
            {inContext ? 'no contexto' : 'fora do contexto'}
          </Badge>
          <p className="text-sm text-ink">{answer}</p>
        </div>
      </Panel>

      <Stats>
        <Stat label="chunks" value={chunks.length} />
        <Stat label="tokens recuperados" value={recoveredTok} tone="accent" />
        <Stat label="melhor similaridade" value={fmt(bestSim)} />
        <Stat
          label="resposta no contexto?"
          value={inContext ? 'sim' : 'não'}
          tone={inContext ? 'emerald' : 'rose'}
        />
      </Stats>

      <Caption>
        Os vetores de 8 dimensões são só uma simulação determinística (hash + palavras-chave), não
        um embedding real. Na pergunta &quot;investimento partido&quot;, chunks pequenos demais
        separam &quot;R$ 2,1 milhões&quot; de &quot;duas parcelas&quot; — o top-k pode pegar um
        pedaço e a resposta some do contexto. Chunking é o vilão silencioso do RAG.
      </Caption>
    </div>
  )
}
