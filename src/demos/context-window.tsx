import { useMemo, useState } from 'react'
import { Caption, Controls, Grid, Legend, Plot, Slider, Stat, Stats, VIZ } from '../components/ui'
import { compact, fmt } from '../lib/mathx'

/* Janela deslizante e custo quadrático de attention. */

const W = 520
const H = 220
const PAD = 36

const BASE_MSGS = [
  { role: 'system', text: 'system prompt', tokens: 180 },
  { role: 'user', text: 'oi, preciso de ajuda com vendas', tokens: 42 },
  { role: 'assistant', text: 'claro, me diga o período', tokens: 28 },
  { role: 'user', text: 'última semana, por loja', tokens: 35 },
  { role: 'assistant', text: 'puxando números…', tokens: 55 },
  { role: 'user', text: 'inclua devoluções', tokens: 22 },
  { role: 'assistant', text: 'tabela com 12 linhas', tokens: 140 },
  { role: 'user', text: 'e a meta?', tokens: 18 },
  { role: 'assistant', text: 'meta regional 2.4M', tokens: 90 },
  { role: 'user', text: 'compare com mês passado', tokens: 48 },
  { role: 'assistant', text: 'crescimento de 8%', tokens: 120 },
  { role: 'user', text: 'filtre SP e RJ', tokens: 30 },
  { role: 'assistant', text: 'SP acima, RJ abaixo', tokens: 160 },
  { role: 'user', text: 'exporte CSV', tokens: 20 },
  { role: 'assistant', text: 'arquivo gerado', tokens: 70 },
  { role: 'user', text: 'agora o forecast', tokens: 38 },
  { role: 'assistant', text: 'cenário base e otimista', tokens: 200 },
  { role: 'user', text: 'e se subir 10%?', tokens: 32 },
  { role: 'assistant', text: 'simulação sensível', tokens: 175 },
  { role: 'user', text: 'resuma em 5 bullets', tokens: 25 },
  { role: 'assistant', text: 'resumo executivo', tokens: 95 },
  { role: 'user', text: 'mande pro Slack', tokens: 18 },
  { role: 'assistant', text: 'rascunho da mensagem', tokens: 80 },
  { role: 'user', text: 'adicione riscos', tokens: 28 },
  { role: 'assistant', text: '3 riscos e mitigações', tokens: 150 },
  { role: 'user', text: 'versao final pro board', tokens: 40 },
  { role: 'assistant', text: 'deck em markdown', tokens: 220 },
  { role: 'user', text: 'traduz pro inglês', tokens: 24 },
  { role: 'assistant', text: 'english version', tokens: 210 },
  { role: 'user', text: 'obrigado', tokens: 8 },
]

const WINDOW_STEPS = [1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072]

export default function ContextWindowDemo() {
  const [winIdx, setWinIdx] = useState(2)
  const [avgScale, setAvgScale] = useState(1)

  const windowSize = WINDOW_STEPS[winIdx]

  const msgs = useMemo(
    () =>
      BASE_MSGS.map((m) => ({
        ...m,
        tokens: Math.max(4, Math.round(m.tokens * avgScale)),
      })),
    [avgScale],
  )

  const totalTokens = msgs.reduce((s, m) => s + m.tokens, 0)

  // Keep system always; fill window from the end of the conversation.
  const { kept, dropped, used } = useMemo(() => {
    const system = msgs[0]
    let budget = windowSize - system.tokens
    const reverse: typeof msgs = []
    let drop = 0
    for (let i = msgs.length - 1; i >= 1; i--) {
      if (budget >= msgs[i].tokens) {
        reverse.push(msgs[i])
        budget -= msgs[i].tokens
      } else {
        drop++
      }
    }
    const rest = reverse.reverse()
    const keptMsgs = [system, ...rest]
    const usedTok = keptMsgs.reduce((s, m) => s + m.tokens, 0)
    return { kept: keptMsgs, dropped: drop, used: usedTok }
  }, [msgs, windowSize])

  // Visual A: bar of conversation
  const barW = W - 2 * PAD
  const barY = 48
  let xCursor = PAD
  const segs = msgs.map((m) => {
    const w = (m.tokens / totalTokens) * barW
    const inWindow = kept.includes(m)
    const seg = { m, x: xCursor, w, inWindow }
    xCursor += w
    return seg
  })

  // Visual B: cost curves (log window on x)
  const curveH = H
  const cPad = 40
  const points = WINDOW_STEPS.map((n) => {
    const t = Math.log2(n / 1024) / Math.log2(131072 / 1024)
    const x = cPad + t * (W - 2 * cPad)
    const att = (n / 4096) ** 2
    const mem = n / 4096
    const maxAtt = (131072 / 4096) ** 2
    const yAtt = curveH - cPad - (att / maxAtt) * (curveH - 2 * cPad)
    const yMem = curveH - cPad - (mem / (131072 / 4096)) * (curveH - 2 * cPad) * 0.85
    return { n, x, yAtt, yMem, att, mem }
  })

  const curT = Math.log2(windowSize / 1024) / Math.log2(131072 / 1024)
  const curX = cPad + curT * (W - 2 * cPad)
  const attRel = (windowSize / 4096) ** 2
  // rough KV: 2 (K,V) * layers * d * n * 2 bytes (fp16) — illustrative
  const layers = 32
  const d = 4096
  const kvGB = (2 * layers * d * windowSize * 2) / 1e9

  return (
    <div className="flex flex-col gap-4">
      <Plot w={W} h={100} aria-label="Conversa na janela de contexto">
        <text x={PAD} y={22} fill={VIZ.muted} fontSize={11}>
          conversa ({compact(totalTokens)} tokens)
        </text>
        {segs.map((s, i) => (
          <g key={i}>
            <rect
              x={s.x}
              y={barY}
              width={Math.max(1, s.w - 0.5)}
              height={28}
              fill={
                s.m.role === 'system'
                  ? VIZ.b
                  : s.inWindow
                    ? s.m.role === 'user'
                      ? VIZ.a
                      : VIZ.d
                    : VIZ.muted
              }
              opacity={s.inWindow ? 0.85 : 0.25}
            />
            {!s.inWindow && s.w > 4 && (
              <line
                x1={s.x}
                y1={barY + 14}
                x2={s.x + s.w}
                y2={barY + 14}
                stroke={VIZ.e}
                strokeWidth={1}
              />
            )}
          </g>
        ))}
        <text x={PAD} y={92} fill={VIZ.b} fontSize={10}>
          system fixo
        </text>
        <text x={W - PAD} y={92} fill={VIZ.muted} fontSize={10} textAnchor="end">
          mensagens antigas caem fora
        </text>
      </Plot>

      <Plot w={W} h={curveH} aria-label="Custo de attention e memória vs janela">
        <Grid w={W} h={curveH} step={48} />
        <text x={cPad} y={18} fill={VIZ.muted} fontSize={11}>
          custo relativo (ref = 4k)
        </text>
        <polyline
          fill="none"
          stroke={VIZ.e}
          strokeWidth={2}
          points={points.map((p) => `${p.x},${p.yAtt}`).join(' ')}
        />
        <polyline
          fill="none"
          stroke={VIZ.a}
          strokeWidth={2}
          strokeDasharray="4 3"
          points={points.map((p) => `${p.x},${p.yMem}`).join(' ')}
        />
        {points.map((p) => (
          <text key={p.n} x={p.x} y={curveH - 12} fill={VIZ.axis} fontSize={9} textAnchor="middle">
            {compact(p.n)}
          </text>
        ))}
        <line
          x1={curX}
          y1={cPad}
          x2={curX}
          y2={curveH - cPad}
          stroke={VIZ.c}
          strokeWidth={1.5}
          strokeDasharray="3 2"
        />
        <circle cx={curX} cy={points[winIdx].yAtt} r={5} fill={VIZ.e} />
      </Plot>

      <Legend
        items={[
          { color: VIZ.e, label: 'attention (∝ n²)' },
          { color: VIZ.a, label: 'KV cache (∝ n)', dashed: true },
          { color: VIZ.b, label: 'system prompt' },
        ]}
      />

      <Controls cols={2}>
        <Slider
          label="tamanho da janela"
          value={winIdx}
          onChange={setWinIdx}
          min={0}
          max={WINDOW_STEPS.length - 1}
          step={1}
          format={() => compact(windowSize)}
        />
        <Slider
          label="tamanho médio das msgs"
          value={avgScale}
          onChange={setAvgScale}
          min={0.4}
          max={2.5}
          step={0.1}
          format={(v) => `${v.toFixed(1)}×`}
        />
      </Controls>

      <Stats>
        <Stat label="tokens usados" value={compact(used)} tone="accent" />
        <Stat label="disponíveis" value={compact(windowSize - used)} />
        <Stat label="msgs esquecidas" value={dropped} tone={dropped > 0 ? 'rose' : 'emerald'} />
        <Stat
          label="attention vs 4k"
          value={`${fmt(attRel, 1)}×`}
          hint={`KV cache ≈ ${fmt(kvGB, 2)} GB (ilustrativo)`}
        />
      </Stats>

      <Caption>
        Dobrar o contexto quadruplica o custo de attention (n²). O system prompt fica fixo no começo
        e come janela o tempo todo; o que “cai fora” é o começo da conversa, não o final. Memória do
        KV cache cresce só linear — ainda assim em dezenas de GB em janelas grandes.
      </Caption>
    </div>
  )
}
