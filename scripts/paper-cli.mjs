import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline/promises'

const rl = createInterface({ input: process.stdin })
const lines = rl[Symbol.asyncIterator]()

async function ask(label, { defaultValue = '', required = false } = {}) {
  while (true) {
    process.stdout.write(`${label}${defaultValue ? ` [${defaultValue}]` : ''}: `)
    const { value, done } = await lines.next()
    if (done) throw new Error('entrada encerrada')
    const answer = value.trim()
    if (answer || defaultValue || !required) return answer || defaultValue
    process.stdout.write('campo obrigatório\n')
  }
}

const slug = await ask('Slug', { required: true })
const title = await ask('Título da página', { required: true })
const tagline = await ask('Tagline', { required: true })
const paperTitle = await ask('Título original do paper', { defaultValue: title })
const authors = await ask('Autores', { required: true })
const year = await ask('Ano', { required: true })
const venue = await ask('Venue')
const arxiv = await ask('ID do arXiv')

let url = ''
let pdfUrl = ''
if (!arxiv) {
  while (!url && !pdfUrl) {
    url = await ask('URL oficial')
    pdfUrl = await ask('URL do PDF')
    if (!url && !pdfUrl) process.stdout.write('informe pelo menos uma URL\n')
  }
}

const minutes = await ask('Tempo de leitura em minutos', { defaultValue: '12' })
const prereqs = await ask('Pré-requisitos, separados por vírgula')
const confirm = await ask('Criar scaffold? (S/n)', { defaultValue: 'S' })
rl.close()

if (!/^s(im)?$/i.test(confirm)) {
  process.stdout.write('cancelado\n')
  process.exit(0)
}

const args = []
const add = (name, value) => {
  if (value) args.push(`--${name}`, value)
}

add('slug', slug)
add('title', title)
add('tagline', tagline)
add('paperTitle', paperTitle)
add('authors', authors)
add('year', year)
add('venue', venue)
add('arxiv', arxiv)
add('url', url)
add('pdfUrl', pdfUrl)
add('min', minutes)
add('prereqs', prereqs)

const result = spawnSync(
  process.execPath,
  [fileURLToPath(new URL('./new-paper.mjs', import.meta.url)), ...args],
  {
    stdio: 'inherit',
  },
)

if (result.error) console.error(`erro: ${result.error.message}`)
process.exitCode = result.status ?? 1
