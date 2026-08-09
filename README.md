# IA do Zero

**No ar em https://ruivalim.github.io/ia-do-zero/**

Curso interativo de inteligência artificial em português. Do que é um dado até como um LLM
escolhe a próxima palavra — com demos que rodam de verdade no navegador, sem backend e sem
chamar API nenhuma.

- **41 conceitos** em 6 trilhas, do básico ao avançado
- Uma **estante de papers** à parte: uma página por paper, em português, com link direto para o
  PDF original na fonte
- **37 demos interativos**, todos calculados localmente em JavaScript
- Cada página tem: uma frase, uma analogia, um demo, uma camada técnica opcional, a pegadinha
  comum e um quiz
- Interruptor global **Simples / Técnico** que abre ou fecha os blocos de aprofundamento
- Tema claro e escuro, responsivo, navegação por teclado (`⌘K` para buscar)

## Rodando

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # gera dist/ estático
pnpm preview    # serve o build
pnpm typecheck  # tsc --noEmit
```

Node 20+ e pnpm. O build é estático: dá para hospedar em qualquer lugar que sirva arquivos.
Como o app usa rotas de history API, configure o host para servir `index.html` em qualquer
caminho (fallback de SPA).

## Estrutura

```
src/
  lib/
    curriculum.ts   índice das trilhas e conceitos — a fonte da verdade da navegação
    glossary.ts     termos do glossário, usados pelo <Term> e pela busca
    mathx.ts        utilitários numéricos puros compartilhados pelos demos
    hooks.ts        useRaf, useInterval, useSize, useSvgPointer, useInView
    store.tsx       tema, nível de detalhe e progresso (localStorage)
  components/
    ui.tsx          kit de controles e gráficos usado por todo demo
    content.tsx     componentes disponíveis dentro do MDX (TLDR, Deep, Quiz, Demo…)
    Layout.tsx      casca, barra superior, gaveta mobile
    Sidebar.tsx     navegação das trilhas com progresso
    Palette.tsx     busca (⌘K)
  pages/            Home, trilha, conceito, glossário, mapa, 404
  demos/
    registry.ts     mapeia <id> → src/demos/<id>.tsx via import.meta.glob
    <id>.tsx        um demo por arquivo, default export, sem props
  content/
    <slug>.mdx      uma página por conceito
```

## Acrescentando um conceito

1. Adicione a entrada em `src/lib/curriculum.ts` (slug, trilha, título, tagline, pré-requisitos).
2. Crie `src/content/<slug>.mdx`.
3. Se tiver demo: crie `src/demos/<id>.tsx` com default export e registre título e legenda no
   `META` de `src/demos/registry.ts`. Referencie com `<Demo id="<id>" />` dentro do MDX.

O contrato completo de implementação — tokens de cor, kit de UI, regras de escrita — está em
[`AGENTS.md`](./AGENTS.md).

## Acrescentando um paper

A trilha `Papers` (`track: 'p'`) é a estante: fora da numeração do curso, uma página por paper.
Nenhum PDF é hospedado aqui — a página linka a fonte e o navegador do leitor abre ou baixa de lá.

```bash
pnpm paper \
  --slug attention-is-all-you-need \
  --title "Atenção substitui recorrência" \
  --tagline "O paper que jogou fora a recorrência." \
  --authors "Vaswani et al." --year 2017 --venue "NeurIPS 2017" \
  --arxiv 1706.03762
```

O comando insere a entrada no currículo entre os marcadores `<papers:*>` e escreve um esqueleto em
`src/content/<slug>.mdx`. Depois é só escrever a página seguindo [`PAPERS.md`](./PAPERS.md) e rodar
`pnpm check`.

Quem usa Claude Code tem a skill `paper-para-topico` em `.claude/skills/` — mande o PDF ou o link
do arXiv e ela faz o caminho inteiro. Qualquer outro modelo ou harness usa o `PAPERS.md` direto.

## Publicando no GitHub Pages

`pnpm build` já gera `dist/404.html` (fallback de SPA) e `dist/.nojekyll`. Em Pages de projeto, o
site fica num subdiretório, então informe o caminho no build:

```bash
BASE_PATH=/ia-do-zero/ pnpm build
```

Em domínio próprio ou Pages de usuário, `pnpm build` puro basta.

## Decisões

- **Sem lib de gráficos.** Cada demo desenha o próprio SVG ou canvas. São 37 visualizações
  bem diferentes; uma lib genérica atrapalharia mais do que ajudaria.
- **Cores só por token CSS.** Nada de hex cru: o site tem tema claro e escuro, e valor fixo
  quebra um dos dois.
- **Aleatoriedade determinística.** Os demos usam um PRNG com semente para abrir sempre igual.
- **Nenhuma chamada de rede.** Os "modelos" dos demos de LLM são tabelas de probabilidade
  escritas à mão, declaradas como ilustrativas na legenda de cada um.

## Contribuindo

Correção de typo, link quebrado ou erro factual pode ir direto em PR. Conceito novo, paper
novo ou mudança de arquitetura: abra uma issue antes. O passo a passo está em
[`CONTRIBUTING.md`](./CONTRIBUTING.md), e as regras de implementação em
[`AGENTS.md`](./AGENTS.md).

Vale o [Código de Conduta](./CODE_OF_CONDUCT.md). Para vulnerabilidade, veja
[`SECURITY.md`](./SECURITY.md) — não abra issue pública.

## Licença

- **Código** (`src/**` exceto `src/content/**`, `scripts/**`, configuração): MIT — veja
  [`LICENSE`](./LICENSE).
- **Conteúdo didático** (`src/content/**` e a prosa deste repositório): CC BY-SA 4.0 — veja
  [`LICENSE-CONTENT`](./LICENSE-CONTENT).

Os papers citados na estante pertencem aos seus autores e editores. Nenhum PDF é hospedado
aqui; as páginas apenas linkam a fonte.
