export type TrackId = 't0' | 't1' | 't2' | 't3' | 't4' | 't5' | 'p'

export type Track = {
  id: TrackId
  slug: string
  n: number
  title: string
  tagline: string
  /** tailwind token name from index.css @theme */
  color: 'blueish' | 'emerald' | 'accent' | 'violet' | 'amber' | 'rose' | 'teal'
  hex: string
  /**
   * `curso` tracks form the numbered linear course. `papers` is the parallel
   * shelf: one page per paper, no fixed order, each page carries its PDF.
   */
  kind: 'curso' | 'papers'
}

/**
 * The source paper behind a `papers` page. Nothing is hosted here: the reader
 * goes to the publisher, so the repo stays leve and o direito autoral é deles.
 */
export type Paper = {
  /** original title, kept in the language it was published in */
  title: string
  /** "Vaswani et al." — short form, never a full author list */
  authors: string
  year: number
  /** NeurIPS, arXiv preprint, ICLR… */
  venue?: string
  /** canonical landing page (arXiv abs, DOI, publisher) */
  url?: string
  /** direct link to the PDF at the source — the browser opens or downloads it */
  pdfUrl?: string
}

export type Concept = {
  slug: string
  track: TrackId
  title: string
  /** one sentence, shown on cards and on hover */
  tagline: string
  /** estimated reading + playing minutes */
  min: number
  /** slugs that make this page much easier to read */
  prereqs?: string[]
  /** key into the demo registry; page renders it inline via <Demo/> in the MDX */
  demo?: string
  tags?: string[]
  /** only on `papers` pages: metadata of the source paper */
  paper?: Paper
}

export const TRACKS: Track[] = [
  {
    id: 't0',
    slug: 'fundamentos',
    n: 0,
    title: 'Fundamentos',
    tagline: 'O vocabulário mínimo: o que é IA, o que é aprender, o que é um dado.',
    color: 'blueish',
    hex: '#60a5fa',
    kind: 'curso',
  },
  {
    id: 't1',
    slug: 'ml-classico',
    n: 1,
    title: 'Machine Learning clássico',
    tagline: 'Os algoritmos que vieram antes das redes — e que ainda ganham em muita coisa.',
    color: 'emerald',
    hex: '#34d399',
    kind: 'curso',
  },
  {
    id: 't2',
    slug: 'redes-neurais',
    n: 2,
    title: 'Redes neurais',
    tagline: 'Do neurônio único ao deep learning: como uma rede realmente aprende.',
    color: 'accent',
    hex: '#22d3ee',
    kind: 'curso',
  },
  {
    id: 't3',
    slug: 'llms',
    n: 3,
    title: 'NLP e LLMs',
    tagline: 'Como texto vira número, e como o número vira a próxima palavra.',
    color: 'violet',
    hex: '#a78bfa',
    kind: 'curso',
  },
  {
    id: 't4',
    slug: 'aplicado',
    n: 4,
    title: 'IA aplicada',
    tagline: 'Prompt, RAG, fine-tuning, agentes, avaliação, custo. A parte que vira produto.',
    color: 'amber',
    hex: '#fbbf24',
    kind: 'curso',
  },
  {
    id: 't5',
    slug: 'avancado',
    n: 5,
    title: 'Avançado e riscos',
    tagline: 'Alinhamento, viés, difusão, escala. O que está na fronteira e o que pode dar errado.',
    color: 'rose',
    hex: '#fb7185',
    kind: 'curso',
  },
  {
    id: 'p',
    slug: 'papers',
    n: 6,
    title: 'Papers',
    tagline: 'Um paper por página, explicado em português, com o PDF original do lado.',
    color: 'teal',
    hex: '#2dd4bf',
    kind: 'papers',
  },
]

export const CONCEPTS: Concept[] = [
  // ── t0 · fundamentos ──────────────────────────────────────────────────────
  {
    slug: 'o-que-e-ia',
    track: 't0',
    title: 'O que é IA, afinal',
    tagline: 'IA, machine learning, deep learning e IA generativa são caixas dentro de caixas.',
    min: 6,
    tags: ['vocabulário'],
  },
  {
    slug: 'tipos-de-aprendizado',
    track: 't0',
    title: 'Tipos de aprendizado',
    tagline: 'Supervisionado, não supervisionado e por reforço: quem dá a resposta certa?',
    min: 7,
    prereqs: ['o-que-e-ia'],
    demo: 'learning-types',
  },
  {
    slug: 'dados-features-rotulos',
    track: 't0',
    title: 'Dado, feature e rótulo',
    tagline: 'Todo modelo enxerga o mundo como uma tabela de números que alguém escolheu.',
    min: 8,
    prereqs: ['tipos-de-aprendizado'],
    demo: 'feature-space',
  },
  {
    slug: 'como-a-maquina-aprende',
    track: 't0',
    title: 'Como a máquina aprende',
    tagline: 'Chuta, mede o erro, corrige. Repete um milhão de vezes. É literalmente isso.',
    min: 9,
    prereqs: ['dados-features-rotulos'],
    demo: 'guess-and-correct',
  },

  // ── t1 · ml clássico ──────────────────────────────────────────────────────
  {
    slug: 'treino-validacao-teste',
    track: 't1',
    title: 'Treino, validação e teste',
    tagline: 'Se o modelo já viu a prova, a nota não vale nada.',
    min: 7,
    prereqs: ['como-a-maquina-aprende'],
    demo: 'data-split',
  },
  {
    slug: 'overfitting',
    track: 't1',
    title: 'Overfitting e underfitting',
    tagline: 'Decorar não é aprender. O ponto ideal fica entre burro demais e detalhista demais.',
    min: 9,
    prereqs: ['treino-validacao-teste'],
    demo: 'polyfit',
  },
  {
    slug: 'regressao-linear',
    track: 't1',
    title: 'Regressão linear',
    tagline: 'O modelo mais simples que existe — e a base matemática de quase todo o resto.',
    min: 8,
    prereqs: ['como-a-maquina-aprende'],
    demo: 'linear-regression',
  },
  {
    slug: 'knn',
    track: 't1',
    title: 'KNN: os vizinhos mais próximos',
    tagline: 'Classifica perguntando "com quem esse ponto se parece?". Sem treino nenhum.',
    min: 8,
    prereqs: ['dados-features-rotulos'],
    demo: 'knn',
  },
  {
    slug: 'kmeans',
    track: 't1',
    title: 'K-means: agrupando sem rótulo',
    tagline: 'Ninguém disse quais são os grupos. O algoritmo inventa e vai ajustando.',
    min: 8,
    prereqs: ['tipos-de-aprendizado'],
    demo: 'kmeans',
  },
  {
    slug: 'arvore-de-decisao',
    track: 't1',
    title: 'Árvores de decisão',
    tagline: 'Uma sequência de perguntas sim/não. O modelo que dá pra explicar pro chefe.',
    min: 8,
    prereqs: ['dados-features-rotulos'],
    demo: 'decision-tree',
  },
  {
    slug: 'metricas',
    track: 't1',
    title: 'Métricas: acurácia mente',
    tagline: 'Precisão, recall, F1 e o threshold que muda tudo sem mudar o modelo.',
    min: 10,
    prereqs: ['treino-validacao-teste'],
    demo: 'confusion-matrix',
  },

  // ── t2 · redes neurais ────────────────────────────────────────────────────
  {
    slug: 'perceptron',
    track: 't2',
    title: 'O perceptron',
    tagline: 'Um neurônio artificial: multiplica, soma, decide. Aprendendo ao vivo.',
    min: 9,
    prereqs: ['regressao-linear'],
    demo: 'perceptron',
  },
  {
    slug: 'funcoes-de-ativacao',
    track: 't2',
    title: 'Funções de ativação',
    tagline: 'Sem elas, mil camadas viram uma só. A dobra que dá poder à rede.',
    min: 7,
    prereqs: ['perceptron'],
    demo: 'activations',
  },
  {
    slug: 'rede-multicamada',
    track: 't2',
    title: 'Rede multicamada (MLP)',
    tagline: 'Empilha neurônios e ela aprende fronteiras que uma reta jamais desenharia.',
    min: 11,
    prereqs: ['funcoes-de-ativacao'],
    demo: 'mlp-playground',
  },
  {
    slug: 'gradiente-descendente',
    track: 't2',
    title: 'Gradiente descendente',
    tagline: 'Descer o morro no escuro, tateando a inclinação. Com passo grande demais, você voa.',
    min: 10,
    prereqs: ['como-a-maquina-aprende'],
    demo: 'gradient-descent',
  },
  {
    slug: 'backpropagation',
    track: 't2',
    title: 'Backpropagation',
    tagline: 'Como a rede descobre a culpa de cada peso lá no fundo — regra da cadeia.',
    min: 11,
    prereqs: ['gradiente-descendente', 'rede-multicamada'],
    demo: 'backprop',
  },
  {
    slug: 'cnn',
    track: 't2',
    title: 'Redes convolucionais (CNN)',
    tagline: 'A mesma lupinha varrendo a imagem inteira. É assim que a máquina enxerga borda.',
    min: 10,
    prereqs: ['rede-multicamada'],
    demo: 'convolution',
  },
  {
    slug: 'rnn-e-sequencias',
    track: 't2',
    title: 'RNN e o problema da memória',
    tagline:
      'Redes que leem em ordem — e esquecem o começo da frase. Por que o Transformer venceu.',
    min: 9,
    prereqs: ['backpropagation'],
    demo: 'vanishing-gradient',
  },

  // ── t3 · nlp e llms ───────────────────────────────────────────────────────
  {
    slug: 'tokenizacao',
    track: 't3',
    title: 'Tokenização',
    tagline: 'O modelo não lê letras nem palavras. Lê pedaços. E isso explica vários bugs.',
    min: 9,
    prereqs: ['dados-features-rotulos'],
    demo: 'tokenizer',
  },
  {
    slug: 'embeddings',
    track: 't3',
    title: 'Embeddings',
    tagline: 'Significado virou coordenada. Palavras parecidas ficam perto no espaço.',
    min: 11,
    prereqs: ['tokenizacao'],
    demo: 'embeddings',
  },
  {
    slug: 'self-attention',
    track: 't3',
    title: 'Self-attention',
    tagline: 'Cada palavra olha para todas as outras e decide de quem depende.',
    min: 12,
    prereqs: ['embeddings'],
    demo: 'attention',
  },
  {
    slug: 'transformer',
    track: 't3',
    title: 'A arquitetura Transformer',
    tagline: 'O bloco que se repete 32, 80, 120 vezes e vira o GPT inteiro.',
    min: 12,
    prereqs: ['self-attention'],
    demo: 'transformer-blocks',
  },
  {
    slug: 'pretreino-e-postreino',
    track: 't3',
    title: 'Pré-treino e pós-treino',
    tagline: 'Um lê a internet inteira. O outro ensina a se comportar. São fases bem diferentes.',
    min: 9,
    prereqs: ['transformer'],
  },
  {
    slug: 'proximo-token',
    track: 't3',
    title: 'Próximo token e amostragem',
    tagline: 'Temperature, top-k e top-p não deixam o modelo mais inteligente. Mexem no dado.',
    min: 11,
    prereqs: ['transformer'],
    demo: 'sampling',
  },
  {
    slug: 'janela-de-contexto',
    track: 't3',
    title: 'Janela de contexto',
    tagline: 'A memória de trabalho do modelo. Custa quadrático e some quando enche.',
    min: 9,
    prereqs: ['proximo-token'],
    demo: 'context-window',
  },
  {
    slug: 'alucinacao',
    track: 't3',
    title: 'Alucinação',
    tagline: 'Não é bug nem mentira: é o que acontece quando o palpite mais provável está errado.',
    min: 9,
    prereqs: ['proximo-token'],
    demo: 'hallucination',
  },

  // ── t4 · aplicado ─────────────────────────────────────────────────────────
  {
    slug: 'prompting',
    track: 't4',
    title: 'Prompting de verdade',
    tagline: 'Zero-shot, few-shot, chain-of-thought: o que cada técnica realmente muda.',
    min: 11,
    prereqs: ['proximo-token'],
    demo: 'prompt-builder',
  },
  {
    slug: 'rag',
    track: 't4',
    title: 'RAG: dar documentos ao modelo',
    tagline: 'Corta, indexa, busca, cola no prompt. A técnica mais usada e mais mal feita.',
    min: 13,
    prereqs: ['embeddings', 'prompting'],
    demo: 'rag-pipeline',
  },
  {
    slug: 'fine-tuning-e-lora',
    track: 't4',
    title: 'Fine-tuning, LoRA e quando não usar',
    tagline:
      'Treinar de novo é caro e raramente é a resposta. LoRA torna viável — pra alguns casos.',
    min: 12,
    prereqs: ['rag'],
    demo: 'lora',
  },
  {
    slug: 'agentes',
    track: 't4',
    title: 'Agentes e ferramentas',
    tagline: 'O modelo não executa nada. Ele pede — e um loop no seu código faz.',
    min: 12,
    prereqs: ['prompting'],
    demo: 'agent-loop',
  },
  {
    slug: 'mcp',
    track: 't4',
    title: 'MCP: o padrão de plugues',
    tagline: 'Um protocolo pra ferramenta escrita uma vez funcionar em qualquer cliente.',
    min: 8,
    prereqs: ['agentes'],
    demo: 'mcp-wiring',
  },
  {
    slug: 'avaliacao',
    track: 't4',
    title: 'Avaliação (evals)',
    tagline: 'Sem suíte de teste você não tem produto de IA, tem demo com sorte.',
    min: 11,
    prereqs: ['metricas', 'prompting'],
    demo: 'eval-suite',
  },
  {
    slug: 'quantizacao',
    track: 't4',
    title: 'Quantização e rodar local',
    tagline: 'Encolher os pesos de 16 bits pra 4. Cabe na sua GPU — e perde um tanto.',
    min: 11,
    prereqs: ['rede-multicamada'],
    demo: 'quantization',
  },

  // ── t5 · avançado e riscos ────────────────────────────────────────────────
  {
    slug: 'rlhf-e-dpo',
    track: 't5',
    title: 'RLHF e DPO',
    tagline: 'Como humanos escolhendo "a resposta A é melhor" viram gradiente.',
    min: 11,
    prereqs: ['pretreino-e-postreino'],
    demo: 'preference-training',
  },
  {
    slug: 'alinhamento',
    track: 't5',
    title: 'Alinhamento e segurança',
    tagline: 'Fazer o modelo querer o que você quis dizer, não o que você escreveu.',
    min: 10,
    prereqs: ['rlhf-e-dpo'],
  },
  {
    slug: 'vies-e-dados',
    track: 't5',
    title: 'Viés e dados',
    tagline: 'O modelo não é preconceituoso. Ele é um espelho estatístico — e isso é pior.',
    min: 10,
    prereqs: ['metricas'],
    demo: 'bias',
  },
  {
    slug: 'difusao',
    track: 't5',
    title: 'Modelos de difusão',
    tagline: 'Aprender a tirar ruído. Depois começar do ruído puro e ver a imagem aparecer.',
    min: 11,
    prereqs: ['cnn'],
    demo: 'diffusion',
  },
  {
    slug: 'multimodal',
    track: 't5',
    title: 'Multimodal',
    tagline:
      'Imagem, áudio e texto no mesmo espaço vetorial. Por isso dá pra conversar sobre foto.',
    min: 9,
    prereqs: ['embeddings'],
    demo: 'multimodal-space',
  },
  {
    slug: 'mixture-of-experts',
    track: 't5',
    title: 'Mixture of Experts',
    tagline: 'Um trilhão de parâmetros, mas só uns poucos acendem por token.',
    min: 10,
    prereqs: ['transformer'],
    demo: 'moe-router',
  },
  {
    slug: 'leis-de-escala',
    track: 't5',
    title: 'Leis de escala',
    tagline: 'Mais dados, mais parâmetros, mais compute. A curva que guiou a década.',
    min: 10,
    prereqs: ['pretreino-e-postreino'],
    demo: 'scaling-laws',
  },
  {
    slug: 'mitos-e-limites',
    track: 't5',
    title: 'Mitos e limites',
    tagline: 'O que a IA de hoje comprovadamente não faz — e o que só parece que não faz.',
    min: 10,
    prereqs: ['alucinacao'],
  },

  // ── p · papers ────────────────────────────────────────────────────────────
  // Gerado por `pnpm paper`. Novas entradas entram logo abaixo desta linha.
  // <papers:start>
  {
    slug: 'attention-is-all-you-need',
    track: 'p',
    title: 'Atenção substitui recorrência',
    tagline:
      'O paper que jogou fora a recorrência, deixou o treino paralelo e virou a base de todo LLM.',
    min: 14,
    prereqs: ['self-attention', 'transformer'],
    paper: {
      title: 'Attention Is All You Need',
      authors: 'Vaswani et al.',
      year: 2017,
      venue: 'NeurIPS 2017',
      url: 'https://arxiv.org/abs/1706.03762',
      pdfUrl: 'https://arxiv.org/pdf/1706.03762',
    },
  },
  {
    slug: 'training-compute-optimal-llms',
    track: 'p',
    title: 'Modelo menor, mais dados',
    tagline:
      'Com o mesmo compute do Gopher, o Chinchilla trocou parâmetros por tokens — e venceu em quase tudo.',
    min: 12,
    prereqs: ['leis-de-escala', 'transformer'],
    paper: {
      title: 'Training Compute-Optimal Large Language Models',
      authors: 'Hoffmann et al.',
      year: 2022,
      venue: 'arXiv 2022',
      url: 'https://arxiv.org/abs/2203.15556',
      pdfUrl: 'https://arxiv.org/pdf/2203.15556',
    },
  },
  {
    slug: 'gemma-4',
    track: 'p',
    title: 'Multimodal sem encoder separado',
    tagline:
      'O Gemma 4 projeta imagem e áudio direto no transformer de 12B e combina contexto longo, quantização e modelos de vários tamanhos.',
    min: 14,
    prereqs: ['multimodal', 'transformer'],
    paper: {
      title: 'Gemma 4 Technical Report',
      authors: 'Gemma Team',
      year: 2026,
      venue: 'arXiv 2026',
      url: 'https://arxiv.org/abs/2607.02770v2',
      pdfUrl: 'https://arxiv.org/pdf/2607.02770v2',
    },
  },
  {
    slug: 'language-models-are-few-shot-learners',
    track: 'p',
    title: 'Few-shot sem atualizar pesos',
    tagline: 'Escalar o modelo para 175 bilhões de parâmetros fez few-shot no contexto competir com fine-tuning em várias tarefas.',
    min: 12,
    prereqs: ['prompting', 'transformer', 'pretreino-e-postreino'],
    paper: {
      title: 'Language Models are Few-Shot Learners',
      authors: 'Brown et al.',
      year: 2020,
      venue: 'NeurIPS 2020',
      url: 'https://arxiv.org/abs/2005.14165',
      pdfUrl: 'https://arxiv.org/pdf/2005.14165',
    },
  },
  // <papers:end>
]

// ── índices derivados ───────────────────────────────────────────────────────

export const BY_SLUG: Record<string, Concept> = Object.fromEntries(CONCEPTS.map((c) => [c.slug, c]))

export const TRACK_BY_ID: Record<TrackId, Track> = Object.fromEntries(
  TRACKS.map((t) => [t.id, t]),
) as Record<TrackId, Track>

export function conceptsOf(track: TrackId): Concept[] {
  return CONCEPTS.filter((c) => c.track === track)
}

export function trackOf(concept: Concept): Track {
  return TRACK_BY_ID[concept.track]
}

export function kindOf(concept: Concept): Track['kind'] {
  return TRACK_BY_ID[concept.track].kind
}

/** the six numbered tracks — the course proper */
export const COURSE_TRACKS: Track[] = TRACKS.filter((t) => t.kind === 'curso')

/** the parallel shelf */
export const PAPER_TRACKS: Track[] = TRACKS.filter((t) => t.kind === 'papers')

export const COURSE_CONCEPTS: Concept[] = CONCEPTS.filter((c) => kindOf(c) === 'curso')

/** one entry per paper page, newest first is the file order */
export const PAPERS: Concept[] = CONCEPTS.filter((c) => kindOf(c) === 'papers')

/** linear order inside each kind — powers prev/next without mixing the two */
export const ORDER: string[] = COURSE_CONCEPTS.map((c) => c.slug)
export const PAPER_ORDER: string[] = PAPERS.map((c) => c.slug)

export function neighbours(slug: string): { prev?: Concept; next?: Concept } {
  const concept = BY_SLUG[slug]
  if (!concept) return {}
  const order = kindOf(concept) === 'papers' ? PAPER_ORDER : ORDER
  const i = order.indexOf(slug)
  if (i < 0) return {}
  return {
    prev: i > 0 ? BY_SLUG[order[i - 1]] : undefined,
    next: i < order.length - 1 ? BY_SLUG[order[i + 1]] : undefined,
  }
}

/** everything that lists `slug` as a prerequisite */
export function unlockedBy(slug: string): Concept[] {
  return CONCEPTS.filter((c) => c.prereqs?.includes(slug))
}

export const TOTAL_MINUTES = COURSE_CONCEPTS.reduce((a, c) => a + c.min, 0)
