# IA do Zero

Curso interativo de inteligência artificial em português. Do que é um dado até como um LLM
escolhe a próxima palavra — com demos que rodam de verdade no navegador, sem backend e sem
chamar API nenhuma.

- **41 conceitos** em 6 trilhas, do básico ao avançado
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

## Decisões

- **Sem lib de gráficos.** Cada demo desenha o próprio SVG ou canvas. São 37 visualizações
  bem diferentes; uma lib genérica atrapalharia mais do que ajudaria.
- **Cores só por token CSS.** Nada de hex cru: o site tem tema claro e escuro, e valor fixo
  quebra um dos dois.
- **Aleatoriedade determinística.** Os demos usam um PRNG com semente para abrir sempre igual.
- **Nenhuma chamada de rede.** Os "modelos" dos demos de LLM são tabelas de probabilidade
  escritas à mão, declaradas como ilustrativas na legenda de cada um.
