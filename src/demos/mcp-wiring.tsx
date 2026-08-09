import { useMemo, useState } from 'react'
import { Caption, Controls, Panel, Plot, Slider, Stat, Stats, VIZ } from '../components/ui'

/* Antes e depois do MCP: N×M integrações vs barramento N+M. */

const W = 520
const H = 280
const TOOL_NAMES = [
  'buscar_vendas',
  'calendario',
  'email',
  'sql',
  'slack',
  'docs',
  'crm',
  'pagamentos',
]
const CLIENT_NAMES = ['IDE', 'Chat', 'Agent', 'CI', 'Mobile', 'Desktop']

const MCP_EXAMPLE = `{
  "name": "buscar_vendas",
  "description": "Retorna vendas diárias de um período",
  "inputSchema": {
    "type": "object",
    "properties": {
      "periodo": { "type": "string", "enum": ["hoje", "ultima_semana"] },
      "loja": { "type": "string" }
    },
    "required": ["periodo"]
  }
}`

export default function McpWiringDemo() {
  const [nClients, setNClients] = useState(3)
  const [nTools, setNTools] = useState(5)

  const without = nClients * nTools
  const withMcp = nClients + nTools
  const save = without > 0 ? Math.round((1 - withMcp / without) * 100) : 0

  const left = useMemo(() => layoutSide(nClients, nTools, false), [nClients, nTools])
  const right = useMemo(() => layoutSide(nClients, nTools, true), [nClients, nTools])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <div className="mb-1 text-[11px] font-semibold tracking-wide text-faint uppercase">
            sem MCP · {without} integrações
          </div>
          <Plot
            w={W / 2}
            h={H}
            aria-label="Integrações ponto a ponto sem MCP"
            className="border border-line rounded-xl bg-surface-2/30"
          >
            {left.edges.map((e, i) => (
              <line
                key={i}
                x1={e.x1}
                y1={e.y1}
                x2={e.x2}
                y2={e.y2}
                stroke={VIZ.e}
                strokeWidth={1}
                opacity={0.45}
              />
            ))}
            {left.clients.map((c, i) => (
              <g key={`c${i}`}>
                <rect
                  x={c.x - 28}
                  y={c.y - 12}
                  width={56}
                  height={24}
                  rx={5}
                  fill={VIZ.a}
                  opacity={0.25}
                  stroke={VIZ.a}
                />
                <text x={c.x} y={c.y + 4} textAnchor="middle" fill={VIZ.ink} fontSize={10}>
                  {c.label}
                </text>
              </g>
            ))}
            {left.tools.map((t, i) => (
              <g key={`t${i}`}>
                <rect
                  x={t.x - 32}
                  y={t.y - 12}
                  width={64}
                  height={24}
                  rx={5}
                  fill={VIZ.b}
                  opacity={0.25}
                  stroke={VIZ.b}
                />
                <text x={t.x} y={t.y + 4} textAnchor="middle" fill={VIZ.ink} fontSize={9}>
                  {t.label}
                </text>
              </g>
            ))}
          </Plot>
        </div>

        <div>
          <div className="mb-1 text-[11px] font-semibold tracking-wide text-faint uppercase">
            com MCP · {withMcp} ligações
          </div>
          <Plot
            w={W / 2}
            h={H}
            aria-label="Integrações via barramento MCP"
            className="border border-line rounded-xl bg-surface-2/30"
          >
            <rect
              x={W / 4 - 36}
              y={H / 2 - 22}
              width={72}
              height={44}
              rx={8}
              fill={VIZ.c}
              opacity={0.2}
              stroke={VIZ.c}
              strokeWidth={1.5}
            />
            <text
              x={W / 4}
              y={H / 2 + 4}
              textAnchor="middle"
              fill={VIZ.c}
              fontSize={12}
              fontWeight={600}
            >
              MCP
            </text>
            {right.edges.map((e, i) => (
              <line
                key={i}
                x1={e.x1}
                y1={e.y1}
                x2={e.x2}
                y2={e.y2}
                stroke={VIZ.d}
                strokeWidth={1.5}
                opacity={0.7}
              />
            ))}
            {right.clients.map((c, i) => (
              <g key={`c${i}`}>
                <rect
                  x={c.x - 28}
                  y={c.y - 12}
                  width={56}
                  height={24}
                  rx={5}
                  fill={VIZ.a}
                  opacity={0.25}
                  stroke={VIZ.a}
                />
                <text x={c.x} y={c.y + 4} textAnchor="middle" fill={VIZ.ink} fontSize={10}>
                  {c.label}
                </text>
              </g>
            ))}
            {right.tools.map((t, i) => (
              <g key={`t${i}`}>
                <rect
                  x={t.x - 32}
                  y={t.y - 12}
                  width={64}
                  height={24}
                  rx={5}
                  fill={VIZ.b}
                  opacity={0.25}
                  stroke={VIZ.b}
                />
                <text x={t.x} y={t.y + 4} textAnchor="middle" fill={VIZ.ink} fontSize={9}>
                  {t.label}
                </text>
              </g>
            ))}
          </Plot>
        </div>
      </div>

      <Controls cols={2}>
        <Slider label="clientes" value={nClients} onChange={setNClients} min={2} max={6} step={1} />
        <Slider label="ferramentas" value={nTools} onChange={setNTools} min={2} max={8} step={1} />
      </Controls>

      <Stats>
        <Stat label="sem MCP" value={without} tone="rose" />
        <Stat label="com MCP" value={withMcp} tone="emerald" />
        <Stat label="economia" value={`${save}%`} tone="accent" />
        <Stat label="arestas" value={`${without} → ${withMcp}`} />
      </Stats>

      <Panel title="definição de ferramenta (MCP)">
        <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-muted">
          {MCP_EXAMPLE}
        </pre>
      </Panel>

      <Caption>
        Sem um protocolo comum, cada cliente implementa cada ferramenta (N×M). Com MCP, clientes e
        ferramentas falam com o barramento uma vez cada (N+M). A definição acima é o contrato: nome,
        descrição e JSON Schema dos parâmetros — o mesmo formato para qualquer host.
      </Caption>
    </div>
  )
}

function layoutSide(nC: number, nT: number, mcp: boolean) {
  const plotW = W / 2
  const clients = Array.from({ length: nC }, (_, i) => ({
    x: 48,
    y: 28 + (i * (H - 56)) / Math.max(1, nC - 1 || 1),
    label: CLIENT_NAMES[i],
  }))
  if (nC === 1) clients[0].y = H / 2

  const tools = Array.from({ length: nT }, (_, i) => ({
    x: plotW - 48,
    y: 28 + (i * (H - 56)) / Math.max(1, nT - 1 || 1),
    label: TOOL_NAMES[i],
  }))
  if (nT === 1) tools[0].y = H / 2

  const bus = { x: plotW / 2, y: H / 2 }
  const edges: { x1: number; y1: number; x2: number; y2: number }[] = []

  if (mcp) {
    for (const c of clients) edges.push({ x1: c.x + 28, y1: c.y, x2: bus.x - 36, y2: bus.y })
    for (const t of tools) edges.push({ x1: bus.x + 36, y1: bus.y, x2: t.x - 32, y2: t.y })
  } else {
    for (const c of clients) {
      for (const t of tools) {
        edges.push({ x1: c.x + 28, y1: c.y, x2: t.x - 32, y2: t.y })
      }
    }
  }

  return { clients, tools, edges }
}
