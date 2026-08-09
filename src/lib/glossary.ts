export type Entry = {
  term: string
  /** one line, shown in the hover card */
  short: string
  /** optional deeper paragraph, shown on the glossary page */
  long?: string
  /** concept slug that explains it properly */
  see?: string
  aka?: string[]
}

export const GLOSSARY: Record<string, Entry> = {
  ia: {
    term: 'Inteligência artificial',
    short: 'Guarda-chuva para qualquer sistema que faz tarefas que associamos a inteligência.',
    long: 'Termo amplo e político. Inclui desde regras escritas à mão nos anos 70 até um LLM de 2026. Quase sempre que alguém diz "IA" hoje, quer dizer machine learning.',
    see: 'o-que-e-ia',
  },
  ml: {
    term: 'Machine learning',
    short: 'Programar por exemplos em vez de por regras: o programa sai dos dados.',
    see: 'o-que-e-ia',
    aka: ['aprendizado de máquina'],
  },
  'deep-learning': {
    term: 'Deep learning',
    short: 'Machine learning com redes neurais de muitas camadas.',
    see: 'rede-multicamada',
  },
  'genai': {
    term: 'IA generativa',
    short: 'Modelos que produzem conteúdo novo (texto, imagem, áudio) em vez de só classificar.',
    see: 'o-que-e-ia',
  },
  modelo: {
    term: 'Modelo',
    short: 'O conjunto de números aprendidos, mais a arquitetura que diz como usá-los.',
    see: 'como-a-maquina-aprende',
  },
  parametro: {
    term: 'Parâmetro',
    short: 'Um número que o treino ajusta. "70B" quer dizer 70 bilhões deles.',
    see: 'rede-multicamada',
    aka: ['peso'],
  },
  hiperparametro: {
    term: 'Hiperparâmetro',
    short: 'Escolha sua, não aprendida: learning rate, número de camadas, k do KNN.',
    see: 'gradiente-descendente',
  },
  feature: {
    term: 'Feature',
    short: 'Uma coluna de entrada: a medida do mundo que o modelo enxerga.',
    see: 'dados-features-rotulos',
    aka: ['atributo', 'variável'],
  },
  rotulo: {
    term: 'Rótulo',
    short: 'A resposta certa de um exemplo, no aprendizado supervisionado.',
    see: 'dados-features-rotulos',
    aka: ['label', 'target'],
  },
  supervisionado: {
    term: 'Aprendizado supervisionado',
    short: 'Treinar com pares entrada→resposta certa.',
    see: 'tipos-de-aprendizado',
  },
  'nao-supervisionado': {
    term: 'Aprendizado não supervisionado',
    short: 'Achar estrutura em dados sem resposta certa: agrupar, comprimir, detectar anomalia.',
    see: 'tipos-de-aprendizado',
  },
  reforco: {
    term: 'Aprendizado por reforço',
    short: 'Aprender por tentativa e recompensa, sem gabarito por passo.',
    see: 'tipos-de-aprendizado',
    aka: ['RL'],
  },
  loss: {
    term: 'Função de perda',
    short: 'O número que mede o quanto o modelo errou. Treinar é minimizar isso.',
    see: 'como-a-maquina-aprende',
    aka: ['loss', 'custo'],
  },
  gradiente: {
    term: 'Gradiente',
    short: 'A direção de subida mais íngreme da perda. Anda-se ao contrário dele.',
    see: 'gradiente-descendente',
  },
  'learning-rate': {
    term: 'Learning rate',
    short: 'Tamanho do passo a cada correção. Pequeno demais trava, grande demais explode.',
    see: 'gradiente-descendente',
    aka: ['taxa de aprendizado', 'lr'],
  },
  epoca: {
    term: 'Época',
    short: 'Uma passada completa por todo o conjunto de treino.',
    see: 'gradiente-descendente',
    aka: ['epoch'],
  },
  batch: {
    term: 'Batch',
    short: 'Grupo de exemplos processados juntos antes de atualizar os pesos.',
    see: 'gradiente-descendente',
  },
  overfitting: {
    term: 'Overfitting',
    short: 'O modelo decorou o treino e vai mal em dado novo.',
    see: 'overfitting',
    aka: ['sobreajuste'],
  },
  underfitting: {
    term: 'Underfitting',
    short: 'O modelo é simples demais e vai mal até no treino.',
    see: 'overfitting',
  },
  regularizacao: {
    term: 'Regularização',
    short: 'Qualquer freio que impede o modelo de se ajustar demais ao treino.',
    see: 'overfitting',
  },
  generalizacao: {
    term: 'Generalização',
    short: 'Acertar em dado que o modelo nunca viu. É o único objetivo que importa.',
    see: 'treino-validacao-teste',
  },
  'conjunto-de-teste': {
    term: 'Conjunto de teste',
    short: 'Dados guardados no cofre, usados uma vez só, no fim.',
    see: 'treino-validacao-teste',
  },
  vazamento: {
    term: 'Vazamento de dados',
    short: 'Informação do teste chega no treino sem querer. Infla a nota e engana.',
    see: 'treino-validacao-teste',
    aka: ['data leakage'],
  },
  acuracia: {
    term: 'Acurácia',
    short: 'Fração de acertos. Enganosa quando as classes são desbalanceadas.',
    see: 'metricas',
  },
  precisao: {
    term: 'Precisão',
    short: 'Dos que o modelo marcou como positivos, quantos eram mesmo.',
    see: 'metricas',
    aka: ['precision'],
  },
  recall: {
    term: 'Recall',
    short: 'Dos positivos que existiam, quantos o modelo pegou.',
    see: 'metricas',
    aka: ['revocação', 'sensibilidade'],
  },
  f1: {
    term: 'F1',
    short: 'Média harmônica de precisão e recall. Um número quando você precisa de um só.',
    see: 'metricas',
  },
  threshold: {
    term: 'Threshold',
    short: 'O corte de probabilidade que transforma um número em decisão sim/não.',
    see: 'metricas',
    aka: ['limiar'],
  },
  neuronio: {
    term: 'Neurônio',
    short: 'Soma ponderada das entradas mais um viés, passada por uma ativação.',
    see: 'perceptron',
  },
  ativacao: {
    term: 'Função de ativação',
    short: 'A não linearidade. Sem ela, empilhar camadas não adianta nada.',
    see: 'funcoes-de-ativacao',
  },
  relu: {
    term: 'ReLU',
    short: 'max(0, x). Barata, simples, e o padrão de fato desde 2012.',
    see: 'funcoes-de-ativacao',
  },
  softmax: {
    term: 'Softmax',
    short: 'Transforma um vetor de números em probabilidades que somam 1.',
    see: 'proximo-token',
  },
  backprop: {
    term: 'Backpropagation',
    short: 'Regra da cadeia aplicada de trás pra frente para achar o gradiente de cada peso.',
    see: 'backpropagation',
  },
  mlp: {
    term: 'MLP',
    short: 'Rede de camadas densas, todas conectadas. O tijolo básico.',
    see: 'rede-multicamada',
    aka: ['rede densa', 'feedforward'],
  },
  cnn: {
    term: 'CNN',
    short: 'Rede que desliza filtros pela entrada. Domina visão computacional.',
    see: 'cnn',
    aka: ['convolucional'],
  },
  rnn: {
    term: 'RNN',
    short: 'Rede que lê em sequência carregando um estado. Sofre com dependências longas.',
    see: 'rnn-e-sequencias',
  },
  token: {
    term: 'Token',
    short: 'O pedaço de texto que o modelo realmente processa. Nem letra, nem palavra.',
    see: 'tokenizacao',
  },
  tokenizador: {
    term: 'Tokenizador',
    short: 'O programa que quebra texto em tokens e devolve os IDs.',
    see: 'tokenizacao',
  },
  bpe: {
    term: 'BPE',
    short: 'Byte Pair Encoding: funde os pares mais frequentes até formar o vocabulário.',
    see: 'tokenizacao',
  },
  embedding: {
    term: 'Embedding',
    short: 'Um vetor de números que representa significado. Perto = parecido.',
    see: 'embeddings',
  },
  cosseno: {
    term: 'Similaridade de cosseno',
    short: 'Mede o ângulo entre dois vetores. 1 é mesma direção, 0 é ortogonal.',
    see: 'embeddings',
  },
  attention: {
    term: 'Attention',
    short: 'Cada posição consulta todas as outras e mistura o que for relevante.',
    see: 'self-attention',
    aka: ['atenção'],
  },
  qkv: {
    term: 'Query, key, value',
    short: 'Três projeções do mesmo token: o que procuro, o que ofereço, o que entrego.',
    see: 'self-attention',
  },
  transformer: {
    term: 'Transformer',
    short: 'Arquitetura de blocos com attention + MLP. Base de praticamente todo LLM.',
    see: 'transformer',
  },
  llm: {
    term: 'LLM',
    short: 'Modelo de linguagem grande: um Transformer treinado para prever o próximo token.',
    see: 'transformer',
  },
  pretreino: {
    term: 'Pré-treino',
    short: 'A fase cara: prever o próximo token em trilhões de tokens de texto.',
    see: 'pretreino-e-postreino',
  },
  'fine-tuning': {
    term: 'Fine-tuning',
    short: 'Continuar treinando um modelo pronto num conjunto pequeno e específico.',
    see: 'fine-tuning-e-lora',
  },
  lora: {
    term: 'LoRA',
    short: 'Treinar duas matrizes pequenas ao lado dos pesos congelados. Barato e reversível.',
    see: 'fine-tuning-e-lora',
  },
  temperature: {
    term: 'Temperature',
    short: 'Achata ou afia a distribuição do próximo token. Não muda o que o modelo sabe.',
    see: 'proximo-token',
  },
  'top-p': {
    term: 'Top-p',
    short: 'Só considera os tokens que somam p de probabilidade. Corta a cauda ruim.',
    see: 'proximo-token',
    aka: ['nucleus sampling'],
  },
  'top-k': {
    term: 'Top-k',
    short: 'Só considera os k tokens mais prováveis, fixo.',
    see: 'proximo-token',
  },
  contexto: {
    term: 'Janela de contexto',
    short: 'Quantos tokens cabem na entrada. Tudo fora dela simplesmente não existe.',
    see: 'janela-de-contexto',
  },
  'kv-cache': {
    term: 'KV cache',
    short: 'Guardar keys e values já calculados para não reprocessar o prompt a cada token.',
    see: 'janela-de-contexto',
  },
  alucinacao: {
    term: 'Alucinação',
    short: 'Saída fluente e confiante que é factualmente falsa.',
    see: 'alucinacao',
  },
  prompt: {
    term: 'Prompt',
    short: 'Todo o texto que entra no modelo, incluindo instruções e histórico.',
    see: 'prompting',
  },
  'few-shot': {
    term: 'Few-shot',
    short: 'Colocar alguns exemplos resolvidos no prompt para fixar formato e estilo.',
    see: 'prompting',
  },
  cot: {
    term: 'Chain of thought',
    short: 'Pedir o raciocínio passo a passo. Gasta tokens para pensar antes de responder.',
    see: 'prompting',
  },
  rag: {
    term: 'RAG',
    short: 'Buscar trechos relevantes e colar no prompt antes de perguntar.',
    see: 'rag',
  },
  chunk: {
    term: 'Chunk',
    short: 'Pedaço de documento indexado separadamente. O tamanho dele decide o sucesso do RAG.',
    see: 'rag',
  },
  'vector-db': {
    term: 'Banco vetorial',
    short: 'Índice que acha os vetores mais próximos de uma consulta, rápido.',
    see: 'rag',
  },
  agente: {
    term: 'Agente',
    short: 'Um loop: o modelo pede uma ferramenta, seu código executa, o resultado volta.',
    see: 'agentes',
  },
  'tool-use': {
    term: 'Tool use',
    short: 'O modelo emite uma chamada estruturada de função em vez de texto solto.',
    see: 'agentes',
  },
  mcp: {
    term: 'MCP',
    short: 'Model Context Protocol: padrão para expor ferramentas e dados a qualquer cliente.',
    see: 'mcp',
  },
  eval: {
    term: 'Eval',
    short: 'Conjunto de casos com critério de aprovação. O teste automatizado da IA.',
    see: 'avaliacao',
  },
  quantizacao: {
    term: 'Quantização',
    short: 'Guardar os pesos com menos bits. Menos memória, um pouco menos de qualidade.',
    see: 'quantizacao',
  },
  rlhf: {
    term: 'RLHF',
    short: 'Treinar com preferências humanas via modelo de recompensa e RL.',
    see: 'rlhf-e-dpo',
  },
  dpo: {
    term: 'DPO',
    short: 'Aprender direto de pares "essa é melhor", sem modelo de recompensa separado.',
    see: 'rlhf-e-dpo',
  },
  alinhamento: {
    term: 'Alinhamento',
    short: 'Fazer o sistema perseguir o objetivo pretendido, não o literal.',
    see: 'alinhamento',
  },
  vies: {
    term: 'Viés',
    short: 'Padrão sistemático nos dados que o modelo reproduz e amplifica.',
    see: 'vies-e-dados',
  },
  difusao: {
    term: 'Difusão',
    short: 'Treinar para remover ruído; gerar partindo de ruído puro.',
    see: 'difusao',
  },
  moe: {
    term: 'Mixture of Experts',
    short: 'Muitos sub-modelos, poucos ativos por token. Capacidade sem custo proporcional.',
    see: 'mixture-of-experts',
  },
  'scaling-laws': {
    term: 'Leis de escala',
    short: 'A perda cai como potência de dados, parâmetros e compute. Previsivelmente.',
    see: 'leis-de-escala',
  },
  multimodal: {
    term: 'Multimodal',
    short: 'Modelo que recebe ou produz mais de um tipo de mídia.',
    see: 'multimodal',
  },
  inferencia: {
    term: 'Inferência',
    short: 'Usar o modelo já treinado. Onde vai quase todo o custo em produção.',
    see: 'quantizacao',
  },
  'destilacao': {
    term: 'Destilação',
    short: 'Treinar um modelo pequeno para imitar a saída de um grande.',
    see: 'quantizacao',
  },
}

export const GLOSSARY_KEYS = Object.keys(GLOSSARY).sort((a, b) =>
  GLOSSARY[a].term.localeCompare(GLOSSARY[b].term, 'pt-BR'),
)
