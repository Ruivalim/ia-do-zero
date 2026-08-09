---
name: paper-para-topico
description: Transforma um paper (PDF, arXiv id ou URL) numa página nova da trilha "Papers" do IA do Zero — lê o PDF fora do repositório, insere a entrada no currículo com os links da fonte e escreve a página em português com TLDR, analogia, camada técnica, pegadinha e quiz. Use quando o usuário mandar um paper, um link de arXiv ou pedir "vira isso num tópico de estudo".
---

# Paper → página da estante

O contrato completo está em `PAPERS.md` na raiz do repositório. **Leia ele inteiro antes de
escrever qualquer coisa**, junto com `AGENTS.md`. Este arquivo é só o roteiro de execução.

## Roteiro

1. **Obtenha o PDF para leitura, fora do repositório.** Baixe para o diretório de scratch da
   sessão (ou `/tmp`), nunca para dentro do projeto — o repo não hospeda PDF. Se o usuário mandou
   um caminho local, leia de lá mesmo.
2. **Leia o PDF de ponta a ponta** com a ferramenta Read (PDFs longos: leia em blocos de até
   20 páginas). Extraia contribuição, problema, método, resultados, limitações e legado.
   Nunca escreva a página só com o que você já sabia do paper de memória — abra o arquivo.
3. **Escolha o slug e o título em português.** Slug em kebab-case derivado do título original;
   título da página diz a ideia em português, não é tradução do título do paper.
4. **Rode o scaffold:**
   ```bash
   pnpm paper --slug <slug> --title "<título pt-BR>" --tagline "<uma frase>" \
     --authors "<Sobrenome et al.>" --year <ano> [--venue "<venue>"] \
     [--arxiv <id> | --url <url> --pdfUrl <url>] [--prereqs slug1,slug2]
   ```
5. **Escreva `src/content/<slug>.mdx`** sobrescrevendo o esqueleto, na ordem que `PAPERS.md`
   manda. 700 a 1100 palavras. Ligue com o curso usando `<Ref to="...">` — confira em
   `src/lib/curriculum.ts` quais slugs existem antes de referenciar.
6. **Verifique:** `pnpm check && pnpm typecheck && pnpm build`. Todos têm que passar.
7. **Reporte** ao usuário: slug, título, onde o PDF ficou, e qualquer coisa do paper que você
   não conseguiu confirmar.

## Regras que quebram a página se ignoradas

- Não invente número, data, benchmark ou citação. Não achou no PDF, escreva qualitativo.
- Nada de `fetch` ou chamada de API dentro de `src/` — o site é estático e offline.
- Cor só por token (`text-teal`, `border-line`…). Nunca hex cru.
- Não edite `src/lib/*`, `src/components/ui.tsx` nem `src/demos/registry.ts` — a única exceção
  é a entrada nova em `curriculum.ts`, e ela quem escreve é o `pnpm paper`.
- Demo é opcional numa página de paper. Só faça se ensinar a ideia central mexendo em algo.
- Nenhum PDF entra no repositório, nem o de licença aberta. Só links em `paper.url` e
  `paper.pdfUrl`. Paper com paywall: só `url`.
