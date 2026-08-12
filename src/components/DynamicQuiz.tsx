import { useCallback, useState } from 'react'
import { useParams } from 'react-router'
import { Quiz, type QuizQ } from './content'
import { useApp } from '../lib/store'
import { rng } from '../lib/mathx'

/** varia a semente quando dois quizzes montam no mesmo milissegundo */
let access = 0

function shuffle<T>(values: T[], next: () => number) {
  const shuffled = values.slice()
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Embaralha as alternativas a cada montagem e espalha a posição da resposta
 * certa entre as perguntas — no conteúdo cru, 108 das 129 respostas eram a
 * letra b, e dava para acertar o quiz sem ler o capítulo.
 *
 * As posições saem de uma urna: cada pergunta tira uma, e a urna é reposta ao
 * esvaziar. Um quiz de três perguntas nunca repete a mesma letra, e quizzes
 * maiores — ou com menos de quatro alternativas — continuam válidos.
 */
function shuffleQuestions(questions: QuizQ[]) {
  const next = rng(Date.now() + ++access)
  const widest = Math.max(1, ...questions.map((q) => q.options.length))
  let urn: number[] = []

  /** sorteia uma posição livre que caiba numa pergunta de `limit` alternativas */
  const draw = (limit: number) => {
    if (!urn.some((slot) => slot < limit)) urn = shuffle([...Array(widest).keys()], next)
    return urn.splice(
      urn.findIndex((slot) => slot < limit),
      1,
    )[0]
  }

  return questions.map((question) => {
    const options = shuffle(
      question.options.map((option, index) => ({ option, index })),
      next,
    )
    const answerAt = options.findIndex(({ index }) => index === question.answer)
    // `answer` fora do intervalo é erro de conteúdo: devolve a pergunta intacta
    if (answerAt < 0) return question

    const answer = draw(options.length)
    ;[options[answerAt], options[answer]] = [options[answer], options[answerAt]]

    return { ...question, options: options.map(({ option }) => option), answer }
  })
}

export default function DynamicQuiz({ questions }: { questions: QuizQ[] }) {
  const [shuffledQuestions, setShuffledQuestions] = useState(() => shuffleQuestions(questions))
  const { slug = '' } = useParams()
  const { isDone, toggleDone } = useApp()

  /** gabaritar vale como ler: marca o capítulo, mas nunca desmarca */
  const onComplete = useCallback(
    (correct: number, total: number) => {
      if (correct === total && slug && !isDone(slug)) toggleDone(slug)
    },
    [slug, isDone, toggleDone],
  )

  return (
    <Quiz
      questions={shuffledQuestions}
      onRetry={() => setShuffledQuestions(shuffleQuestions(questions))}
      onComplete={onComplete}
    />
  )
}
