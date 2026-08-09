/**
 * Scaffolds a page on the `papers` shelf: insere a entrada no currículo entre os
 * marcadores <papers:*> e escreve um esqueleto MDX para o modelo preencher.
 *
 * Nenhum PDF entra no repositório — a página só guarda os links da fonte, e o
 * navegador do leitor abre ou baixa direto de lá.
 *
 * A metade mecânica do pipeline. A metade que escreve é a PAPERS.md.
 *
 *   node scripts/new-paper.mjs \
 *     --slug attention-is-all-you-need \
 *     --title "Atenção substitui recorrência" \
 *     --tagline "Trocar recorrência por atenção deixou o treino paralelo." \
 *     --authors "Vaswani et al." --year 2017 --venue "NeurIPS 2017" \
 *     --url https://arxiv.org/abs/1706.03762 \
 *     --pdfUrl https://arxiv.org/pdf/1706.03762
 *
 * Atalho: --arxiv 1706.03762 preenche --url e --pdfUrl sozinho.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname

// ── args ────────────────────────────────────────────────────────────────────

const args = {}
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i]
  if (!a.startsWith('--')) continue
  const key = a.slice(2)
  const next = process.argv[i + 1]
  if (next && !next.startsWith('--')) {
    args[key] = next
    i++
  } else {
    args[key] = true
  }
}

const die = (msg) => {
  console.error(`erro: ${msg}`)
  process.exit(1)
}

if (args.arxiv) {
  args.url ??= `https://arxiv.org/abs/${args.arxiv}`
  args.pdfUrl ??= `https://arxiv.org/pdf/${args.arxiv}`
}

const required = ['slug', 'title', 'tagline', 'authors', 'year']
for (const k of required) if (!args[k]) die(`falta --${k}`)
if (!args.url && !args.pdfUrl) die('falta --url ou --pdfUrl (ou --arxiv)')

const slug = String(args.slug)
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) die(`slug inválido: "${slug}" (use kebab-case)`)

const year = Number(args.year)
if (!Number.isInteger(year) || year < 1940 || year > 2100) die(`ano inválido: ${args.year}`)

for (const k of ['url', 'pdfUrl']) {
  if (args[k] && !/^https:\/\/\S+$/.test(String(args[k]))) die(`--${k} precisa ser uma URL https`)
}

const minutes = args.min ? Number(args.min) : 12
const prereqs = args.prereqs
  ? String(args.prereqs)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  : []

// ── entrada no currículo ────────────────────────────────────────────────────

const curriculumPath = join(root, 'src/lib/curriculum.ts')
const curriculum = readFileSync(curriculumPath, 'utf8')

if (new RegExp(`slug: '${slug}'`).test(curriculum)) die(`o slug "${slug}" já está no currículo`)

const END = '  // <papers:end>'
if (!curriculum.includes(END)) die('marcador <papers:end> sumiu do curriculum.ts')

const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")

const entry = [
  '  {',
  `    slug: '${slug}',`,
  "    track: 'p',",
  `    title: '${esc(args.title)}',`,
  `    tagline: '${esc(args.tagline)}',`,
  `    min: ${minutes},`,
  prereqs.length ? `    prereqs: [${prereqs.map((p) => `'${p}'`).join(', ')}],` : null,
  '    paper: {',
  `      title: '${esc(args.paperTitle ?? args.title)}',`,
  `      authors: '${esc(args.authors)}',`,
  `      year: ${year},`,
  args.venue ? `      venue: '${esc(args.venue)}',` : null,
  args.url ? `      url: '${esc(args.url)}',` : null,
  args.pdfUrl ? `      pdfUrl: '${esc(args.pdfUrl)}',` : null,
  '    },',
  '  },',
]
  .filter(Boolean)
  .join('\n')

writeFileSync(curriculumPath, curriculum.replace(END, `${entry}\n${END}`))
console.log('index adicionado em src/lib/curriculum.ts')

// ── esqueleto da página ─────────────────────────────────────────────────────

const mdxPath = join(root, `src/content/${slug}.mdx`)
if (existsSync(mdxPath)) {
  console.log(`mdx   já existe, mantido: src/content/${slug}.mdx`)
} else {
  const skeleton = `<TLDR>TODO: a contribuição do paper em uma frase, **negrito no núcleo**.</TLDR>

<Analogy>TODO: comparação com a vida real.</Analogy>

## O problema antes do paper

TODO: o que não funcionava, em prosa.

## A ideia

TODO: a ideia central, sem matemática.

<Steps
  items={[
    ['TODO', 'TODO'],
    ['TODO', 'TODO'],
  ]}
/>

## O que mudou depois

TODO: consequência prática, sem inventar número.

<Deep>
  TODO: a matemática, o custo, o formato do tensor, a armadilha de implementação.
</Deep>

<Callout type="trap">TODO: o que quase todo mundo entende errado deste paper.</Callout>

<Quiz
  questions={[
    { q: 'TODO', options: ['TODO', 'TODO', 'TODO', 'TODO'], answer: 0, why: 'TODO' },
    { q: 'TODO', options: ['TODO', 'TODO', 'TODO', 'TODO'], answer: 0, why: 'TODO' },
    { q: 'TODO', options: ['TODO', 'TODO', 'TODO', 'TODO'], answer: 0, why: 'TODO' },
  ]}
/>
`
  writeFileSync(mdxPath, skeleton)
  console.log(`mdx   esqueleto src/content/${slug}.mdx`)
}

console.log(`\npronto. agora escreva a página seguindo PAPERS.md e rode:\n  pnpm check && pnpm typecheck`)
