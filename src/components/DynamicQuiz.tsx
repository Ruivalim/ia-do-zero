import { useState } from 'react'
import { Quiz, type QuizQ } from './content'
import { rng } from '../lib/mathx'

let access = 0

function shuffle<T>(values: T[], next: () => number) {
  const shuffled = values.slice()
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function shuffleQuestions(questions: QuizQ[]) {
  const next = rng(Date.now() + ++access)
  const correctSlots = shuffle([0, 1, 2, 3], next)

  return questions.map((question, qi) => {
    const options = shuffle(
      question.options.map((option, index) => ({ option, index })),
      next,
    )
    const answerAt = options.findIndex(({ index }) => index === question.answer)
    const answer = correctSlots[qi]

    if (answerAt >= 0 && answer !== undefined) {
      ;[options[answerAt], options[answer]] = [options[answer], options[answerAt]]
    }

    return { ...question, options: options.map(({ option }) => option), answer }
  })
}

export default function DynamicQuiz({ questions }: { questions: QuizQ[] }) {
  const [shuffledQuestions] = useState(() => shuffleQuestions(questions))
  return <Quiz questions={shuffledQuestions} />
}
