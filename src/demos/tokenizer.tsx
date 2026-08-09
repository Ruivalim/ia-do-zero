import { useMemo, useState } from 'react'
import { Btn, Caption, Row, Stat, Stats, Toggle } from '../components/ui'

/* A miniature BPE-style tokenizer. Not GPT's real vocabulary — it is a hand
   built one of ~420 pieces — but it reproduces the behaviour that matters:
   the leading-space convention, common words as one piece, rare words split
   into fragments, and non-ASCII exploding into bytes. */

const COMMON = `
o a os as um uma uns umas de do da dos das em no na nos nas por para com sem sobre
que se como quando onde qual quais quem porque pois mas e ou nem já ainda também
não sim muito pouco mais menos todo toda todos todas cada outro outra
ser estar ter haver fazer poder dever ir vir dar ver saber querer dizer
é são foi era será está estão tem têm há vai vou pode deve faz fez
eu tu ele ela nós vós eles elas me te se lhe nos vos lhes meu minha seu sua
isso isto aquilo esse essa este esta aquele aquela
modelo modelos dado dados rede redes camada camadas texto palavra palavras
token tokens treino treinar aprende aprender neur ônio computador máquina
inteligência artificial exemplo exemplos número números valor valores
the of and to in is are was were be been for on with as at by an it this that
model models data token tokens layer layers train training learn learning
`
  .trim()
  .split(/\s+/)

const SUFFIXES = [
  'ção','ções','mente','ando','endo','indo','ável','ível','idade','agem','ismo','ista',
  'ador','adores','ência','ância','inho','inha','zinho','ário','oso','osa','eiro','eira',
  'ing','tion','tions','ness','ment','ally','ed','er','ers','est','ly','s',
]

const PREFIXES = ['des', 'in', 'im', 're', 'pre', 'pré', 'pro', 'sub', 'super', 'multi', 'auto', 'inter']

const PUNCT = [...'.,;:!?()[]{}"\'`-–—/\\|@#$%&*+=<>~^', '...', '?!', '\n', '\n\n']

// pieces are stored with the GPT convention: a leading "␣" means "starts a word"
const VOCAB: string[] = [
  ...COMMON.flatMap((w) => [w, `␣${w}`]),
  ...SUFFIXES,
  ...PREFIXES.flatMap((p) => [p, `␣${p}`]),
  ...PUNCT,
  ...'abcdefghijklmnopqrstuvwxyz0123456789'.split('').flatMap((c) => [c, `␣${c}`]),
]

const VOCAB_SET = new Set(VOCAB)
const ID_OF = new Map(VOCAB.map((piece, i) => [piece, i + 256]))
// longest first, so greedy matching prefers whole words over fragments
const SORTED = [...VOCAB].sort((a, b) => b.length - a.length)

type Tok = { text: string; id: number; kind: 'word' | 'frag' | 'byte' | 'space' }

function tokenize(input: string): Tok[] {
  const out: Tok[] = []
  let i = 0
  const lower = input.toLowerCase()

  while (i < input.length) {
    const spaced = input[i] === ' '
    const start = spaced ? i + 1 : i
    if (spaced && start >= input.length) {
      out.push({ text: ' ', id: 220, kind: 'space' })
      break
    }

    let matched = ''
    for (const piece of SORTED) {
      const bare = piece.startsWith('␣') ? piece.slice(1) : piece
      if (piece.startsWith('␣') !== spaced) continue
      if (!bare) continue
      if (lower.startsWith(bare, start)) {
        matched = bare
        break
      }
    }

    if (matched) {
      const raw = input.slice(start, start + matched.length)
      const key = (spaced ? '␣' : '') + matched
      const whole =
        COMMON.includes(matched) &&
        !/[a-z0-9]/i.test(input[start + matched.length] ?? '')
      out.push({
        text: (spaced ? ' ' : '') + raw,
        id: ID_OF.get(key) ?? 0,
        kind: whole ? 'word' : 'frag',
      })
      i = start + matched.length
      continue
    }

    // no piece matched: fall back to raw UTF-8 bytes, exactly like a real BPE
    const ch = String.fromCodePoint(input.codePointAt(start)!)
    const bytes = new TextEncoder().encode(ch)
    bytes.forEach((b, k) => {
      out.push({ text: k === 0 ? (spaced ? ' ' : '') + ch : '', id: b, kind: 'byte' })
    })
    i = start + ch.length
  }

  return out.filter((t, idx) => t.text !== '' || idx === 0 || true)
}

const KIND_STYLE: Record<Tok['kind'], string> = {
  word: 'border-accent/50 bg-accent/10 text-ink',
  frag: 'border-violet/50 bg-violet/10 text-ink',
  byte: 'border-rose/50 bg-rose/10 text-ink',
  space: 'border-line bg-surface-2 text-faint',
}

const PRESETS: [string, string][] = [
  ['Português', 'A inteligência artificial não lê palavras, ela lê pedaços.'],
  ['Inglês', 'Artificial intelligence does not read words, it reads pieces.'],
  ['Código', 'const embeddings = model.encode(texto).slice(0, 128)'],
  ['Emoji e nomes', 'Ruivalim ficou 🤯 com o resultado do experimento.'],
]

export default function TokenizerDemo() {
  const [text, setText] = useState(PRESETS[0][1])
  const [showIds, setShowIds] = useState(false)

  const tokens = useMemo(() => tokenize(text), [text])
  const chars = [...text].length
  const ratio = tokens.length ? chars / tokens.length : 0

  return (
    <div className="flex flex-col gap-4">
      <Row>
        {PRESETS.map(([label, value]) => (
          <Btn key={label} onClick={() => setText(value)}>
            {label}
          </Btn>
        ))}
      </Row>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        spellCheck={false}
        aria-label="Texto para tokenizar"
        className="w-full resize-y rounded-xl border border-line bg-surface-2 px-3.5 py-3 font-mono text-sm text-ink outline-none focus:border-accent/60"
      />

      <div className="flex flex-wrap gap-1 rounded-xl border border-line bg-surface-2/40 p-3 min-h-16">
        {tokens.map((t, i) => (
          <span
            key={i}
            title={`token #${i + 1} · id ${t.id}`}
            className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[13px] ${KIND_STYLE[t.kind]}`}
          >
            <span className="whitespace-pre">{t.text.replace(/^ /, '␣').replace(/\n/g, '⏎')}</span>
            {showIds && <span className="text-[10px] text-faint">{t.id}</span>}
          </span>
        ))}
        {tokens.length === 0 && <span className="text-sm text-faint">digite algo acima…</span>}
      </div>

      <Row>
        <Toggle label="mostrar os IDs" checked={showIds} onChange={setShowIds} />
      </Row>

      <Stats>
        <Stat label="caracteres" value={chars} />
        <Stat label="tokens" value={tokens.length} tone="accent" />
        <Stat label="chars por token" value={ratio.toFixed(2)} />
        <Stat
          label="custo a US$3/M"
          value={`$${((tokens.length / 1e6) * 3).toFixed(6)}`}
          hint="Preço de entrada típico de um modelo de ponta"
        />
      </Stats>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-accent/50 bg-accent/20" /> palavra
          inteira
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-violet/50 bg-violet/20" /> pedaço de
          palavra
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-rose/50 bg-rose/20" /> byte cru
        </span>
      </div>

      <Caption>
        Este é um tokenizador de brinquedo com ~{VOCAB_SET.size} peças, não o vocabulário real de
        nenhum modelo (esses têm 50 mil a 200 mil). Mas o comportamento é o mesmo: palavra comum
        vira um token só, palavra rara vira vários, e o que não está no vocabulário desce a nível
        de byte — por isso um emoji custa três ou quatro tokens sozinho.
      </Caption>
    </div>
  )
}
