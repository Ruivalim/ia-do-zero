/**
 * Consistency check between the curriculum index, the MDX pages and the demo
 * registry. Run with `pnpm check`. Exits non-zero on any missing piece so it
 * can sit in CI.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const curriculum = readFileSync(join(root, 'src/lib/curriculum.ts'), 'utf8')
// only the CONCEPTS array — TRACKS has a `slug` field too
const conceptBlock = curriculum.slice(curriculum.indexOf('export const CONCEPTS'))

const slugs = [...conceptBlock.matchAll(/^\s{4}slug: '([a-z0-9-]+)',$/gm)].map((m) => m[1])
const demoIds = [...conceptBlock.matchAll(/^\s{4}demo: '([a-z0-9-]+)',$/gm)].map((m) => m[1])

const contentDir = join(root, 'src/content')
const demoDir = join(root, 'src/demos')
const pages = readdirSync(contentDir).filter((f) => f.endsWith('.mdx'))
const demos = readdirSync(demoDir)
  .filter((f) => f.endsWith('.tsx'))
  .map((f) => f.replace(/\.tsx$/, ''))

const problems = []
const warn = []

for (const slug of slugs) {
  if (!existsSync(join(contentDir, `${slug}.mdx`))) {
    problems.push(`falta a página src/content/${slug}.mdx`)
    continue
  }
  const body = readFileSync(join(contentDir, `${slug}.mdx`), 'utf8')
  const required = [
    ['<TLDR>', 'TLDR'],
    ['<Analogy', 'Analogy'],
    ['<Deep', 'Deep'],
    ['<Quiz', 'Quiz'],
  ]
  for (const [needle, name] of required) {
    if (!body.includes(needle)) problems.push(`${slug}.mdx: falta <${name}>`)
  }
  if (!body.includes('type="trap"')) warn.push(`${slug}.mdx: sem Callout type="trap"`)
  if (/^#\s/m.test(body)) problems.push(`${slug}.mdx: usa h1, deve começar em ##`)

  const words = body.split(/\s+/).length
  if (words < 550) warn.push(`${slug}.mdx: curta demais (${words} palavras)`)

  // every <Demo id> must exist and match what the curriculum declares
  for (const m of body.matchAll(/<Demo\s+id="([a-z0-9-]+)"/g)) {
    if (!demos.includes(m[1])) problems.push(`${slug}.mdx: demo "${m[1]}" não existe`)
  }
  // every <Ref to> must point at a real concept
  for (const m of body.matchAll(/<Ref\s+to="([a-z0-9-]+)"/g)) {
    if (!slugs.includes(m[1])) problems.push(`${slug}.mdx: <Ref to="${m[1]}"> não existe`)
  }
}

for (const id of demoIds) {
  if (!demos.includes(id)) problems.push(`falta o demo src/demos/${id}.tsx`)
  const page = slugs.find((s) => {
    const p = join(contentDir, `${s}.mdx`)
    return existsSync(p) && readFileSync(p, 'utf8').includes(`<Demo id="${id}"`)
  })
  if (!page) warn.push(`demo "${id}" declarado no currículo mas não montado em nenhuma página`)
}

const orphanPages = pages
  .map((f) => f.replace(/\.mdx$/, ''))
  .filter((s) => !slugs.includes(s))
for (const s of orphanPages) warn.push(`src/content/${s}.mdx não está no currículo`)

const orphanDemos = demos.filter((d) => !demoIds.includes(d))
for (const d of orphanDemos) warn.push(`src/demos/${d}.tsx não está declarado no currículo`)

// ── estante de papers ───────────────────────────────────────────────────────

// cada bloco `paper: { … }` precisa de pelo menos um link, e nada de PDF local
const paperBlocks = [...conceptBlock.matchAll(/paper: \{([^}]*)\}/g)].map((m) => m[1])
for (const block of paperBlocks) {
  const title = /title: '([^']*)'/.exec(block)?.[1] ?? '?'
  if (!/\burl:/.test(block) && !/\bpdfUrl:/.test(block)) {
    problems.push(`paper "${title}": sem url nem pdfUrl`)
  }
  if (/\bpdf:/.test(block.replace(/pdfUrl:/g, ''))) {
    problems.push(`paper "${title}": PDF local não é servido, use pdfUrl`)
  }
  for (const m of block.matchAll(/(url|pdfUrl): '([^']*)'/g)) {
    if (!/^https:\/\//.test(m[2])) problems.push(`paper "${title}": ${m[1]} não é https`)
  }
}

// páginas geradas pelo esqueleto e nunca escritas
for (const slug of slugs) {
  const p = join(contentDir, `${slug}.mdx`)
  if (existsSync(p) && readFileSync(p, 'utf8').includes('TODO')) {
    problems.push(`${slug}.mdx: ainda tem TODO do esqueleto`)
  }
}

console.log(
  `conceitos: ${slugs.length} · páginas: ${pages.length} · demos: ${demos.length} · papers: ${paperBlocks.length}`,
)
for (const w of warn) console.log(`  aviso  ${w}`)
for (const p of problems) console.log(`  ERRO   ${p}`)

if (problems.length) {
  console.log(`\n${problems.length} problema(s).`)
  process.exit(1)
}
console.log(warn.length ? `\n${warn.length} aviso(s), nenhum erro.` : '\ntudo consistente.')
