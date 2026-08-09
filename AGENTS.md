# AGENTS.md — contrato de implementação

Projeto: **IA do Zero**, um curso interativo de inteligência artificial em português (pt-BR).
Vite + React 19 + TypeScript strict + Tailwind v4 + MDX. Sem backend, sem chamada de rede.
Tudo roda no navegador do leitor.

Leia este arquivo inteiro antes de escrever qualquer linha.

Se a tarefa é **transformar um paper numa página**, leia também [`PAPERS.md`](./PAPERS.md) — é o
contrato da trilha `Papers`, que tem estrutura própria e um scaffold (`pnpm paper`). Tudo daqui
continua valendo lá.

---

## Regras que não se negociam

1. **Não instale dependências.** Nada de d3, framer-motion, recharts, lodash. Só React, o que já
   está em `src/lib` e `src/components/ui.tsx`.
2. **Nenhuma chamada de rede.** Nada de `fetch`, nada de API de LLM. Todo cálculo é local.
3. **TypeScript strict** com `noUnusedLocals` e `noUnusedParameters` ligados. Sem `any`,
   sem `@ts-ignore`. O comando `pnpm typecheck` tem que passar limpo.
4. **Zero cor crua.** Nunca escreva `#22d3ee`, `rgb(...)`, `text-gray-400`, `bg-slate-800`.
   Use só os tokens listados abaixo. O site tem tema claro e escuro; hex fixo quebra um dos dois.
5. **Responsivo de verdade.** Nada de largura fixa em pixel num container. SVG sempre pelo
   componente `<Plot>`. Tabela ou coisa larga vai dentro de `overflow-x-auto`.
6. **Determinístico.** Se precisar de aleatório, use `rng(seed)` de `src/lib/mathx.ts`.
   Nunca `Math.random()` direto — o demo tem que abrir igual toda vez.
7. **Português do Brasil** em todo texto visível. Termo técnico consagrado fica em inglês
   (_token_, _embedding_, _learning rate_, _overfitting_, _attention_). Não traduza esses.
8. **Não edite** `src/lib/*`, `src/components/ui.tsx`, `src/components/content.tsx`,
   `src/demos/registry.ts`, nem arquivos de outro agente. Só crie os arquivos que te pedirem.
9. Sem emoji em código. Sem comentário narrando o óbvio.

---

## Tokens de cor disponíveis

Classes Tailwind (funcionam nos dois temas):

```
texto:    text-ink  text-muted  text-faint
          text-accent  text-violet  text-amber  text-emerald  text-rose  text-blueish
fundo:    bg-bg  bg-surface  bg-surface-2   (e as variantes /10 /20 /40 para transparência)
borda:    border-line  border-accent/40  border-rose/40  ...
```

Dentro de SVG, use o objeto `VIZ` importado de `../components/ui`:

```ts
VIZ.a  // ciano  — série principal
VIZ.b  // violeta
VIZ.c  // âmbar
VIZ.d  // verde
VIZ.e  // rosa
VIZ.f  // azul
VIZ.grid VIZ.axis VIZ.ink VIZ.muted VIZ.surface VIZ.border
SERIES // = [VIZ.a … VIZ.f], para séries categóricas em ordem
```

Convenção semântica: verde = certo/positivo, rosa = errado/negativo, âmbar = atenção,
ciano = o que o modelo previu, violeta = o alvo verdadeiro.

---

## Kit de UI — `src/components/ui.tsx`

Monte o demo **com estas peças**. Não reinvente slider, botão ou card.

```tsx
<Controls cols={1|2|3}>…</Controls>     // grid responsivo de controles
<Row>…</Row>                            // linha flex com wrap
<Panel title?>…</Panel>                 // caixinha com borda

<Slider label value onChange min max step? format? hint? disabled? />
<Choice label? value options={[{value,label,title?}]} onChange />   // segmented control
<Toggle label checked onChange />
<Btn onClick variant="primary"|"ghost"|"danger" disabled? title?>…</Btn>

<Stats><Stat label value unit? tone? hint? /> …</Stats>   // grade de números
<Bar value={0..1} color? label? right? highlight? />       // barra de probabilidade
<Legend items={[{color,label,dashed?}]} />
<Badge tone?>…</Badge>
<Caption>…</Caption>                    // parágrafo final: o que reparar

<Plot w={520} h={320} svgRef? …props>…</Plot>   // <svg> responsivo com viewBox
<Grid w h step? />                              // grade de fundo dentro do Plot
```

`tone` aceita: `ink | accent | emerald | amber | rose | violet`.

## Utilitários — `src/lib/mathx.ts`

`clamp lerp round remap rng gaussian softmax dot norm cosine euclid mean sum sampleIndex
entropy gini polyfit polyval solve mse fmt compact`

## Hooks — `src/lib/hooks.ts`

`useRaf(cb, running)` · `useInterval(fn, ms, running)` · `useSize()` · `useSvgPointer(svgRef)`
· `useInView()` · `useMediaQuery(q)` · `usePrefersReducedMotion()`

---

## Anatomia de um demo

Arquivo: `src/demos/<id>.tsx`, **default export**, sem props.

```tsx
import { useMemo, useState } from 'react'
import { Caption, Choice, Controls, Plot, Row, Slider, Stat, Stats, VIZ } from '../components/ui'
import { rng } from '../lib/mathx'

const W = 520
const H = 320

export default function AlgumaCoisaDemo() {
  const [x, setX] = useState(1)
  // ...
  return (
    <div className="flex flex-col gap-4">
      <Row>{/* botões e presets */}</Row>
      <Plot w={W} h={H} aria-label="descrição do que o gráfico mostra">
        …
      </Plot>
      <Controls>{/* sliders */}</Controls>
      <Stats>{/* números que mudam ao vivo */}</Stats>
      <Caption>O que o leitor deve reparar aqui.</Caption>
    </div>
  )
}
```

Regras de conteúdo do demo:

- **Tem que ensinar uma coisa.** Se dá pra mexer em tudo e nada muda de forma perceptível,
  o demo falhou. Prefira um controle que muda o resultado dramaticamente a cinco que não mudam.
- O `<Caption>` final aponta o que reparar, incluindo o caso em que dá errado.
- Estado inicial já interessante: o leitor não deve precisar mexer pra ver algo.
- Alvo de toque no mínimo 32×32 px. Nada que dependa de hover para funcionar
  (hover pode _acrescentar_, nunca ser o único caminho).
- Anime com `useRaf` ou `useInterval`, sempre com um botão de pausar.
- Tamanho: 90 a 200 linhas. Se passar muito disso, o demo está fazendo demais.

Leia `src/demos/perceptron.tsx` e `src/demos/tokenizer.tsx` antes de começar — são as
duas referências, uma de SVG e uma de DOM.

---

## Anatomia de uma página de conteúdo

Arquivo: `src/content/<slug>.mdx`. Os componentes abaixo estão disponíveis **sem import**
(vêm por MDXProvider). Leia `src/content/perceptron.mdx` como referência.

```mdx
<TLDR>Uma frase, negrito no núcleo da ideia.</TLDR>

<Analogy>Comparação com a vida real. Pode ser imprecisa, esse é o ponto.</Analogy>

## Subtítulo em português

Prosa. `<Term id="chave">palavra</Term>` faz tooltip do glossário.
`<Ref to="slug">link</Ref>` liga a outro capítulo.

<Steps
  items={[
    ['Título', 'explicação'],
    ['Título', 'explicação'],
  ]}
/>

<Demo id="id-do-demo" />

<Versus left="A" right="B" rows={[['aspecto', 'lado A', 'lado B']]} />

<Callout type="trap">A confusão que quase todo mundo faz.</Callout>
<Callout type="warn|info|ok">…</Callout>

<Deep>
  Camada técnica: matemática em `$…$` e `$$…$$` (KaTeX), custo, detalhe de implementação. Fica
  fechada no modo "Simples" e aberta no modo "Técnico".
</Deep>

<Quiz
  questions={[
    { q: '…', options: ['…', '…', '…', '…'], answer: 1, why: 'Por que essa e não as outras.' },
  ]}
/>
```

Estrutura obrigatória de toda página, nesta ordem:

1. `<TLDR>` — sempre o primeiro elemento
2. `<Analogy>` — logo depois
3. Prosa e seções `##` explicando de leve
4. `<Demo id="…" />` no meio do texto, quando a página tem demo (o índice diz quais têm)
5. Pelo menos um `<Deep>` com a matemática ou o detalhe de engenharia
6. Pelo menos um `<Callout type="trap">` com o erro comum
7. `<Quiz>` com 3 perguntas, sempre por último

Regras de escrita:

- Tom: direto, concreto, um pouco seco. Escreva como quem explica pra um colega esperto de
  outra área. Sem "vamos embarcar nessa jornada", sem "no mundo de hoje", sem exclamação.
- Frase curta. Voz ativa. Número concreto sempre que existir.
- Nada de `#` (h1) — o título já vem do índice. Comece em `##`.
- Não invente número, benchmark, data ou citação. Se não tem certeza, escreva de forma
  qualitativa ("na casa dos bilhões") em vez de chutar precisão falsa.
- 700 a 1100 palavras por página, fora o quiz.
- O `<Deep>` fala com quem programa: complexidade, formato de tensor, custo, armadilha de
  implementação. Não repita a prosa de cima em palavras difíceis.
- Se citar pessoa, use ele/ela só quando o pronome for conhecido; senão reescreva sem pronome.

---

## Verificação antes de terminar

```bash
pnpm typecheck     # obrigatório, tem que sair limpo
pnpm build         # obrigatório
```

Se seu arquivo quebrar o build, conserte antes de reportar pronto.
Reporte no fim: os arquivos que criou e qualquer decisão que fugiu deste contrato.
