import { useMemo, useState } from 'react'
import { Caption, Panel, Stat, Stats, Toggle } from '../components/ui'

/* Montar o prompt e ver o efeito na resposta simulada. */

type Blocks = {
  persona: boolean
  contexto: boolean
  formato: boolean
  fewshot: boolean
  cot: boolean
  json: boolean
}

const DEFAULT: Blocks = {
  persona: true,
  contexto: true,
  formato: false,
  fewshot: false,
  cot: false,
  json: false,
}

function buildPrompt(b: Blocks): string {
  const parts: string[] = []
  if (b.persona) {
    parts.push(
      'Você é um analista de dados sênior. Responda em português do Brasil, com precisão e sem floreio.',
    )
  }
  if (b.contexto) {
    parts.push(
      'Contexto: a loja X vendeu R$ 48.200 na última semana; a meta semanal é R$ 45.000; houve 12 devoluções.',
    )
  }
  if (b.formato) {
    parts.push(
      'Formato: comece com um veredito em uma linha, depois 3 bullets de evidência, sem introdução.',
    )
  }
  if (b.fewshot) {
    parts.push(
      [
        'Exemplos:',
        'P: vendas 30k, meta 40k → R: Abaixo da meta. Evidências: −25% vs meta; volume fraco em SP; devoluções estáveis.',
        'P: vendas 55k, meta 50k → R: Acima da meta. Evidências: +10% vs meta; pico na sexta; ticket médio subiu.',
      ].join('\n'),
    )
  }
  if (b.cot) {
    parts.push('Pense passo a passo antes da resposta final. Mostre o raciocínio.')
  }
  if (b.json) {
    parts.push(
      'Responda APENAS com JSON válido no esquema: {"veredito":"acima|abaixo","delta_pct":number,"evidencias":string[]}',
    )
  }
  parts.push('Pergunta: as vendas da última semana bateram a meta?')
  return parts.join('\n\n')
}

function buildReply(b: Blocks): string {
  if (b.json) {
    return JSON.stringify(
      {
        veredito: 'acima',
        delta_pct: 7.1,
        evidencias: [
          'vendas 48200 vs meta 45000',
          '12 devoluções no período',
          b.fewshot ? 'padrão alinhado aos exemplos' : 'comparação direta com a meta',
        ],
      },
      null,
      2,
    )
  }
  if (b.cot) {
    return [
      'Raciocínio: meta = 45000; vendas = 48200; delta = +3200 ≈ +7,1%.',
      'Devoluções (12) não alteram o veredito de bater a meta bruta.',
      '',
      b.formato
        ? 'Acima da meta.\n- +7,1% sobre 45k\n- 48,2k em vendas brutas\n- 12 devoluções registradas'
        : 'Sim: as vendas ficaram cerca de 7% acima da meta semanal.',
    ].join('\n')
  }
  if (b.formato) {
    return 'Acima da meta.\n- vendas R$ 48.200\n- meta R$ 45.000 (+7,1%)\n- 12 devoluções no período'
  }
  if (b.fewshot) {
    return 'Acima da meta. Evidências: +7,1% vs meta; volume sólido; devoluções sob controle.'
  }
  if (b.persona || b.contexto) {
    return 'Com base nos números fornecidos, a loja superou a meta semanal (48,2k frente a 45k).'
  }
  return 'Provavelmente sim, mas depende dos números exatos de vendas e da meta.'
}

function adherence(b: Blocks): string {
  if (b.json && b.formato) return 'alta (JSON vence o formato prosa)'
  if (b.json) return 'alta (esquema rígido)'
  if (b.formato && b.fewshot) return 'alta'
  if (b.formato || b.fewshot) return 'média'
  if (b.cot) return 'média (raciocínio solto)'
  return 'baixa'
}

export default function PromptBuilderDemo() {
  const [b, setB] = useState<Blocks>(DEFAULT)

  const prompt = useMemo(() => buildPrompt(b), [b])
  const reply = useMemo(() => buildReply(b), [b])
  const pTok = Math.round(prompt.length / 3.6)
  const rTok = Math.round(reply.length / 3.6)
  const costIn = (pTok / 1e6) * 3
  const costOut = (rTok / 1e6) * 15

  const set = (key: keyof Blocks) => (v: boolean) => setB((prev) => ({ ...prev, [key]: v }))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Toggle label="papel / persona" checked={b.persona} onChange={set('persona')} />
        <Toggle label="contexto" checked={b.contexto} onChange={set('contexto')} />
        <Toggle label="regras de formato" checked={b.formato} onChange={set('formato')} />
        <Toggle label="3 exemplos few-shot" checked={b.fewshot} onChange={set('fewshot')} />
        <Toggle label="pense passo a passo" checked={b.cot} onChange={set('cot')} />
        <Toggle label="esquema JSON" checked={b.json} onChange={set('json')} />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel title="prompt montado">
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-ink">
            {prompt}
          </pre>
        </Panel>
        <Panel title="resposta simulada">
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-ink">
            {reply}
          </pre>
        </Panel>
      </div>

      <Stats>
        <Stat label="tokens do prompt" value={pTok} tone="accent" />
        <Stat label="tokens da resposta" value={rTok} />
        <Stat
          label="custo est."
          value={`$${(costIn + costOut).toFixed(5)}`}
          hint={`in $${costIn.toFixed(5)} @ $3/M · out $${costOut.toFixed(5)} @ $15/M`}
        />
        <Stat label="aderência ao formato" value={adherence(b)} tone="violet" />
      </Stats>

      <Caption>
        Chain-of-thought custa tokens de saída (mais caros); few-shot custa tokens de entrada em
        toda chamada. Esquema JSON troca prosa por estrutura rígida. A escolha entre blocos é de
        custo e controle, não só de qualidade aparente.
      </Caption>
    </div>
  )
}
