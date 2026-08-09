# Contribuindo

Obrigado pelo interesse. Este é um curso de IA em português: contribuição aqui é
tanto código quanto texto, e o texto conta tanto quanto o resto.

## Antes de abrir PR grande

Abra uma issue primeiro para conceito novo, paper novo ou mudança de arquitetura.
Correção de erro de digitação, link quebrado ou bug pequeno pode ir direto em PR.

## Ambiente

Node 20+ e pnpm.

```bash
pnpm install
pnpm dev        # http://localhost:5173
```

## O contrato

[`AGENTS.md`](./AGENTS.md) é o contrato de implementação: tokens de cor, kit de UI,
anatomia de demo, anatomia de página, regras de escrita. Leia antes de escrever a
primeira linha — ele vale para pessoas e para agentes.

[`PAPERS.md`](./PAPERS.md) é o contrato da trilha `Papers`, que tem estrutura própria.

As regras que mais reprovam PR:

1. **Sem dependência nova.** Só React, `src/lib` e `src/components/ui.tsx`.
2. **Nenhuma chamada de rede.** Todo cálculo roda no navegador do leitor.
3. **Zero cor crua.** Só token; hex fixo quebra um dos dois temas.
4. **Determinístico.** Use `rng(seed)` de `src/lib/mathx.ts`, nunca `Math.random()`.
5. **TypeScript strict.** Sem `any`, sem `@ts-ignore`.
6. **Não invente número, benchmark, data ou citação.**

## Acrescentando um conceito

1. Entrada em `src/lib/curriculum.ts` (slug, trilha, título, tagline, pré-requisitos).
2. Página em `src/content/<slug>.mdx` — `<TLDR>`, `<Analogy>`, prosa, `<Deep>`,
   `<Callout type="trap">` e `<Quiz>` de 3 perguntas, nessa ordem.
3. Se tiver demo: `src/demos/<id>.tsx` com default export, sem props, e o título e a
   legenda no `META` de `src/demos/registry.ts`. Referencie com `<Demo id="<id>" />`.

## Acrescentando um paper

```bash
pnpm paper \
  --slug attention-is-all-you-need \
  --title "Atenção substitui recorrência" \
  --tagline "O paper que jogou fora a recorrência." \
  --authors "Vaswani et al." --year 2017 --venue "NeurIPS 2017" \
  --arxiv 1706.03762
```

O comando insere a entrada no currículo e escreve o esqueleto da página. Depois é
escrever seguindo [`PAPERS.md`](./PAPERS.md).

**Nenhum PDF entra no repositório.** A página linka a fonte original; o navegador do
leitor abre ou baixa de lá. PR que suba PDF é fechado.

## Antes de mandar o PR

```bash
pnpm check       # índice x páginas x demos x links dos papers
pnpm typecheck   # tem que sair limpo
pnpm build
pnpm format
```

Os três primeiros são exatamente o que a CI roda.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/), assunto em português,
minúsculo, no imperativo, sem ponto final:

```
feat: pagina sobre destilacao de modelo
fix: navegacao entre capitulos travava no capitulo anterior
docs: corrige link do paper de chinchilla
chore: atualiza vite
```

Tipos em uso: `feat`, `fix`, `docs`, `chore`, `ci`, `refactor`, `style`.

## Conteúdo gerado por IA

Parte deste curso foi escrita com ajuda de modelo de linguagem, e a home diz isso
abertamente. Se você usou modelo, tudo bem — mas **você é responsável por conferir**.
Cheque todo número, data, nome e citação antes de mandar. Erro factual em página de
curso é o pior tipo de bug daqui.

## Licença da sua contribuição

Ao contribuir, você concorda que o código vai sob MIT e o conteúdo didático sob
CC BY-SA 4.0. Veja [`LICENSE`](./LICENSE) e [`LICENSE-CONTENT`](./LICENSE-CONTENT).

## Conduta

Vale o [Código de Conduta](./CODE_OF_CONDUCT.md).
