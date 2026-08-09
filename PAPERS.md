# PAPERS.md — de um PDF a uma página da estante

Contrato para transformar **um paper** numa página da trilha `Papers` (`track: 'p'`).
Serve para qualquer modelo em qualquer harness: Claude Code, Codex, Cursor, um script seu.
Leia junto com [`AGENTS.md`](./AGENTS.md) — as regras de escrita e de componentes valem aqui igual.

O que muda em relação a uma página de curso:

- vive na trilha `p`, fora da numeração das seis trilhas do curso;
- carrega o campo `paper` no currículo, com os links da fonte — **nenhum PDF entra no repositório**;
- o botão de abrir o PDF aparece sozinho, a partir de `paper.pdfUrl` — você **não** escreve nada
  disso no MDX;
- demo é opcional. Só faça um se der para mexer em algo que ensina a ideia do paper.

---

## Passo 1 — leia o paper de verdade

Antes de escrever qualquer linha, extraia do PDF:

- **a contribuição**: o que este paper faz que os anteriores não faziam;
- **o problema**: o que estava travado antes dele;
- **o método**: a ideia central, em uma frase sem jargão e depois em detalhe;
- **os resultados**: só os números que estão escritos no paper;
- **as limitações**: as que os próprios autores admitem;
- **o legado**: o que veio depois por causa dele.

Se algum item não estiver claro no PDF, escreva de forma qualitativa. **Não invente número,
data, benchmark nem citação.**

## Passo 2 — rode o scaffold

```bash
pnpm paper \
  --slug attention-is-all-you-need \
  --title "Atenção substitui recorrência" \
  --tagline "Trocar recorrência por atenção deixou o treino paralelo — e destravou a escala." \
  --authors "Vaswani et al." \
  --year 2017 \
  --venue "NeurIPS 2017" \
  --arxiv 1706.03762
```

`--arxiv <id>` preenche `--url` (página abs) e `--pdfUrl` (PDF direto). Fora do arXiv, passe os
dois na mão. Tem que existir pelo menos um dos dois — o script recusa sem link.

Opcionais: `--min` (minutos, padrão 12), `--prereqs slug1,slug2`, `--paperTitle`
(quando o título do paper e o título da página diferem — o normal, veja abaixo).

O comando insere a entrada no `curriculum.ts` entre os marcadores `<papers:*>` e cria
`src/content/<slug>.mdx` cheio de `TODO`. Ele **não** baixa nada.

Para escrever a página você precisa ler o paper. Baixe para um diretório temporário fora do
repositório — `/tmp`, a pasta de scratch do seu harness — leia de lá e não commite.

## Passo 3 — escreva a página

Sobrescreva o esqueleto inteiro. Estrutura obrigatória, nesta ordem:

1. `<TLDR>` — a contribuição do paper em uma frase
2. `<Analogy>` — a ideia comparada com algo do dia a dia
3. `## O problema antes do paper` — o que travava
4. `## A ideia` — o método sem matemática, geralmente com `<Steps>`
5. `## O que mudou depois` — resultados e legado, só com número que está no PDF
6. `<Deep>` — a matemática, a complexidade, o custo, a armadilha de implementação
7. `<Callout type="trap">` — o que a maioria entende errado sobre este paper
8. `<Callout type="warn">` opcional — as limitações que os autores admitem
9. `<Quiz>` com 3 perguntas — sempre por último

Regras próprias da estante:

- **Título da página em português**, dizendo a ideia: "Atenção substitui recorrência", não
  "Attention Is All You Need". O título original fica no campo `paper.title` e aparece no card.
- 700 a 1100 palavras, mesmo alvo do curso.
- Ligue com o curso: `<Ref to="self-attention">` sempre que o paper tocar num conceito que já
  existe. Uma página de paper sem nenhum `<Ref>` está solta demais.
- Cite trecho do paper com moderação: uma frase entre aspas, no máximo duas na página.
  O PDF está a um clique — a página é a explicação, não a tradução.
- Nada de tom de release: sem "revolucionário", sem "mudou tudo". Diga o que mudou e quanto.

## Passo 4 — verifique

```bash
pnpm check       # índice ↔ mdx ↔ demos ↔ links; falha se sobrou TODO
pnpm typecheck
pnpm build
```

`pnpm check` reprova a página se o `paper` não tiver link, se algum link não for `https`, se
alguém tentar declarar PDF local, se faltar `<TLDR>`, `<Analogy>`, `<Deep>` ou `<Quiz>`, ou se
sobrou um `TODO` do esqueleto.

---

## Sem o scaffold (harness que não roda comando)

Dá para fazer os dois passos na mão:

1. insira no `CONCEPTS` de `src/lib/curriculum.ts`, entre `// <papers:start>` e `// <papers:end>`:

```ts
{
  slug: 'attention-is-all-you-need',
  track: 'p',
  title: 'Atenção substitui recorrência',
  tagline: 'O paper que trocou RNN por atenção e deixou o treino paralelo.',
  min: 12,
  prereqs: ['self-attention'],
  paper: {
    title: 'Attention Is All You Need',
    authors: 'Vaswani et al.',
    year: 2017,
    venue: 'NeurIPS 2017',
    url: 'https://arxiv.org/abs/1706.03762',
    pdfUrl: 'https://arxiv.org/pdf/1706.03762',
  },
},
```

2. escreva `src/content/<slug>.mdx` seguindo o passo 3.

## Direito autoral

O repositório não hospeda PDF nenhum, e é de propósito: o leitor vai na fonte, o download é
entre o navegador e o publisher, e o repo não redistribui nada. Paper atrás de paywall entra
igual — só com `url`, sem `pdfUrl`, e a página mostra só o botão da página oficial.
