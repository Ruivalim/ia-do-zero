import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

/* ────────────────────────────────────────────────────────────────────────────
   Every file in this folder named `<id>.tsx` with a default export becomes a
   demo, mountable from any MDX page with <Demo id="<id>" />.
   Metadata below supplies the header title and the caption under the frame.
   ──────────────────────────────────────────────────────────────────────────── */

type Meta = { title: string; note?: string }

const META: Record<string, Meta> = {
  // t0
  'learning-types': {
    title: 'Os três aprendizados no mesmo dado',
    note: 'Os mesmos pontos, três perguntas diferentes. O algoritmo muda porque a pergunta mudou, não porque o dado mudou.',
  },
  'feature-space': {
    title: 'Escolha as features',
    note: 'Duas features boas separam as classes sozinhas. Duas ruins não têm salvação — nem com o melhor modelo do mundo.',
  },
  'guess-and-correct': {
    title: 'Chuta, mede, corrige',
    note: 'Arraste a reta na mão e depois deixe o algoritmo fazer. É o mesmo movimento, só que rápido e sem opinião.',
  },
  // t1
  'data-split': {
    title: 'Separando treino, validação e teste',
    note: 'Repare no que acontece com a nota de teste quando você deixa o mesmo dado aparecer nos dois lados.',
  },
  polyfit: {
    title: 'Do underfitting ao overfitting',
    note: 'O erro de treino só cai. O de validação faz U. O fundo do U é o modelo que você quer.',
  },
  'linear-regression': {
    title: 'Regressão linear ao vivo',
    note: 'Cada passo move a reta na direção que mais reduz o erro quadrático. Nada mais que isso.',
  },
  knn: {
    title: 'KNN: mude o k, mude a fronteira',
    note: 'k pequeno decora o ruído; k grande apaga o detalhe. O ponto certo depende do dado, sempre.',
  },
  kmeans: {
    title: 'K-means iterando',
    note: 'Atribui, move o centro, repete. Rode várias vezes com sementes diferentes: nem sempre dá o mesmo resultado.',
  },
  'decision-tree': {
    title: 'Cortando o espaço com perguntas',
    note: 'Cada pergunta é um corte reto. Profundidade demais e cada folha vira um exemplo só — overfitting puro.',
  },
  'confusion-matrix': {
    title: 'O threshold que muda tudo',
    note: 'O modelo é o mesmo o tempo todo. Só o corte muda — e com ele a precisão, o recall e a conversa com o cliente.',
  },
  // t2
  perceptron: {
    title: 'Um neurônio aprendendo',
    note: 'Funciona para AND e OR. Tente XOR e veja a reta oscilar para sempre: um neurônio não resolve.',
  },
  activations: {
    title: 'As funções de ativação lado a lado',
    note: 'Veja a derivada junto: onde ela é quase zero, o gradiente morre e a camada para de aprender.',
  },
  'mlp-playground': {
    title: 'Treine uma rede de verdade',
    note: 'Roda no seu navegador, sem servidor. Duas camadas escondidas já resolvem espiral — com paciência.',
  },
  'gradient-descent': {
    title: 'Descendo a superfície de perda',
    note: 'Learning rate alto demais faz a bolinha subir a parede. Baixo demais, ela nunca chega.',
  },
  backprop: {
    title: 'O gradiente voltando pela rede',
    note: 'Siga um número: ele nasce no erro da saída e se multiplica pelos pesos até chegar na primeira camada.',
  },
  convolution: {
    title: 'Um filtro varrendo a imagem',
    note: 'O mesmo kernel de 3×3, aplicado em todo canto. É por isso que a CNN reconhece uma borda em qualquer posição.',
  },
  'vanishing-gradient': {
    title: 'A memória que se apaga',
    note: 'A cada passo de tempo o sinal é multiplicado de novo. Menor que 1, some; maior que 1, explode.',
  },
  // t3
  tokenizer: {
    title: 'Veja seu texto virar tokens',
    note: 'Português gasta mais tokens que inglês. Emoji e código gastam ainda mais. Isso é custo direto na conta.',
  },
  embeddings: {
    title: 'O espaço onde significado é distância',
    note: 'Arraste as palavras. A similaridade de cosseno acompanha o ângulo, não a distância até a origem.',
  },
  attention: {
    title: 'Quem olha para quem',
    note: 'Passe o mouse num token para ver de onde ele puxa informação. A máscara causal impede olhar pro futuro.',
  },
  'transformer-blocks': {
    title: 'Dentro de um bloco Transformer',
    note: 'Clique em cada peça. O bloco inteiro se repete dezenas de vezes — é literalmente o modelo todo.',
  },
  sampling: {
    title: 'Temperature, top-k e top-p',
    note: 'A distribuição é sempre a mesma. Você só está decidindo de qual pedaço dela vai sortear.',
  },
  'context-window': {
    title: 'A janela deslizante e o custo',
    note: 'O custo de attention cresce com o quadrado do contexto. Dobrar a janela quadruplica a conta.',
  },
  hallucination: {
    title: 'Onde a alucinação nasce',
    note: 'Quando nenhum token é claramente o certo, o modelo escolhe o mais plausível. Plausível não é verdadeiro.',
  },
  // t4
  'prompt-builder': {
    title: 'Monte o prompt e veja o efeito',
    note: 'Cada bloco que você liga muda o formato e o custo. Compare tokens gastos contra qualidade esperada.',
  },
  'rag-pipeline': {
    title: 'RAG passo a passo',
    note: 'Mexa no tamanho do chunk e no k. É onde quase todo RAG ruim quebra — não no modelo.',
  },
  lora: {
    title: 'LoRA: por que é tão barato',
    note: 'Duas matrizes finas substituem uma gorda. O rank r decide quanto o adaptador consegue aprender.',
  },
  'agent-loop': {
    title: 'O loop do agente',
    note: 'O modelo nunca executa nada. Ele devolve um pedido; quem roda é o seu código, e o resultado volta como texto.',
  },
  'mcp-wiring': {
    title: 'Antes e depois do MCP',
    note: 'N clientes × M ferramentas vira N + M. É a única mágica do protocolo, e é suficiente.',
  },
  'eval-suite': {
    title: 'Uma suíte de eval rodando',
    note: 'Mude o prompt e veja quais casos quebram. Sem isso, "melhorei o prompt" é chute.',
  },
  quantization: {
    title: 'De 16 bits para 4',
    note: 'A memória despenca e o erro sobe. Em 8 bits quase ninguém nota; em 2 bits o modelo desmonta.',
  },
  // t5
  'preference-training': {
    title: 'Preferência humana virando gradiente',
    note: 'Escolha A ou B algumas vezes. A política vai deslizando para o lado que você premiou.',
  },
  bias: {
    title: 'Como o viés entra pelo dado',
    note: 'O algoritmo é o mesmo. Só a amostra mudou — e a fronteira de decisão foi junto.',
  },
  diffusion: {
    title: 'Ruído virando imagem',
    note: 'Arraste o passo para frente e para trás. Treinar é aprender a fazer um único desses passos bem.',
  },
  'multimodal-space': {
    title: 'Imagem e texto no mesmo espaço',
    note: 'Quando os dois vetores caem perto, a busca por texto acha a imagem. É toda a ideia do CLIP.',
  },
  'moe-router': {
    title: 'O roteador escolhendo experts',
    note: 'Só dois experts acendem por token. O modelo tem capacidade de gigante e custo de médio.',
  },
  'scaling-laws': {
    title: 'A curva que guiou a década',
    note: 'Em escala log-log a perda vira quase uma reta. Foi essa reta que justificou os data centers.',
  },
}

const modules = import.meta.glob<{ default: ComponentType }>('./*.tsx')

export type DemoEntry = Meta & { Component: LazyExoticComponent<ComponentType> }

export const DEMOS: Record<string, DemoEntry> = Object.fromEntries(
  Object.entries(modules).map(([path, load]) => {
    const id = path.replace(/^\.\//, '').replace(/\.tsx$/, '')
    return [
      id,
      {
        title: META[id]?.title ?? id,
        note: META[id]?.note,
        Component: lazy(load),
      },
    ]
  }),
)

export const DEMO_IDS = Object.keys(DEMOS).sort()
