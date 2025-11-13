'use client'

import { useState } from 'react'
import { CheckCircle, X, RotateCcw, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QuizQuestion {
    id: string
    question: string
    questionAr: string
    type: 'multiple-choice' | 'true-false' | 'fill-blank'
    options?: {
        id: string
        text: string
        textAr: string
        isCorrect: boolean
    }[]
    correctAnswer?: string
    explanation?: string
    explanationAr?: string
}

interface QuizComponentProps {
    questions: QuizQuestion[]
    lessonId: string
    onComplete: (score: number, passed: boolean) => void
    lang: 'en' | 'ar'
    passingScore?: number
}

export default function QuizComponent({
    questions,
    lessonId,
    onComplete,
    lang,
    passingScore = 70
}: QuizComponentProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [showResults, setShowResults] = useState(false)
    const [score, setScore] = useState(0)
    const [showExplanations, setShowExplanations] = useState(false)

    const currentQuestion = questions[currentQuestionIndex]
    const isLastQuestion = currentQuestionIndex === questions.length - 1
    const hasAnswered = answers[currentQuestion.id] !== undefined

    const handleAnswer = (answer: string) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: answer
        }))
    }

    const nextQuestion = () => {
        if (isLastQuestion) {
            calculateScore()
        } else {
            setCurrentQuestionIndex(prev => prev + 1)
        }
    }

    const calculateScore = () => {
        let correct = 0
        questions.forEach(question => {
            const userAnswer = answers[question.id]
            if (question.type === 'multiple-choice') {
                const correctOption = question.options?.find(opt => opt.isCorrect)
                if (userAnswer === correctOption?.id) {
                    correct++
                }
            } else if (question.type === 'true-false') {
                if (userAnswer === question.correctAnswer) {
                    correct++
                }
            }
        })

        const finalScore = Math.round((correct / questions.length) * 100)
        setScore(finalScore)
        setShowResults(true)
        onComplete(finalScore, finalScore >= passingScore)
    }

    const retryQuiz = () => {
        setCurrentQuestionIndex(0)
        setAnswers({})
        setShowResults(false)
        setScore(0)
        setShowExplanations(false)
    }

    if (showResults) {
        const passed = score >= passingScore
        return (
            <div className="max-w-2xl mx-auto p-6 bg-background">
                <div className="text-center mb-8">
                    <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${passed ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                        {passed ? (
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        ) : (
                            <X className="w-10 h-10 text-red-600" />
                        )}
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-foreground">
                        {passed
                            ? (lang === 'en' ? 'Congratulations!' : 'مبروك!')
                            : (lang === 'en' ? 'Keep Trying!' : 'استمر في المحاولة!')
                        }
                    </h2>
                    <p className="text-lg text-foreground mb-2">
                        {lang === 'en' ? 'Your Score:' : 'درجتك:'} {score}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {lang === 'en'
                            ? `Passing score: ${passingScore}%`
                            : `الدرجة المطلوبة: ${passingScore}%`
                        }
                    </p>
                </div>

                <div className="space-y-4">
                    {!passed && (
                        <Button onClick={retryQuiz} className="w-full" variant="outline">
                            <RotateCcw className="w-4 h-4 mr-2" />
                            {lang === 'en' ? 'Retry Quiz' : 'إعادة المحاولة'}
                        </Button>
                    )}

                    <Button
                        onClick={() => setShowExplanations(!showExplanations)}
                        className="w-full"
                        variant="secondary"
                    >
                        {showExplanations
                            ? (lang === 'en' ? 'Hide Explanations' : 'إخفاء التفسيرات')
                            : (lang === 'en' ? 'Show Explanations' : 'عرض التفسيرات')
                        }
                    </Button>

                    {showExplanations && (
                        <div className="space-y-4 mt-6">
                            <h3 className="font-semibold text-lg text-foreground">
                                {lang === 'en' ? 'Answer Explanations' : 'تفسير الإجابات'}
                            </h3>
                            {questions.map((question, index) => {
                                const userAnswer = answers[question.id]
                                const correctOption = question.options?.find(opt => opt.isCorrect)
                                const isCorrect = question.type === 'multiple-choice'
                                    ? userAnswer === correctOption?.id
                                    : userAnswer === question.correctAnswer

                                return (
                                    <div key={question.id} className="border rounded-lg p-4 bg-background">
                                        <div className="flex items-start gap-2 mb-2">
                                            {isCorrect ? (
                                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                                            ) : (
                                                <X className="w-5 h-5 text-red-600 mt-0.5" />
                                            )}
                                            <div>
                                                <p className="font-medium">
                                                    {lang === 'en' ? `${index + 1}. ${question.question}` : `${index + 1}. ${question.questionAr}`}
                                                </p>
                                                {question.explanation && (
                                                    <p className="text-sm text-muted-foreground mt-2">
                                                        {lang === 'en' ? question.explanation : question.explanationAr}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto p-6 bg-background">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-foreground">
                        {lang === 'en' ? 'Progress' : 'التقدم'}
                    </span>
                    <span className="text-sm text-foreground">
                        {currentQuestionIndex + 1} / {questions.length}
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Question */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-6 text-foreground">
                    {lang === 'en' ? currentQuestion.question : currentQuestion.questionAr}
                </h2>

                {/* Multiple Choice Options */}
                {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
                    <div className="space-y-3">
                        {currentQuestion.options.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => handleAnswer(option.id)}
                                className={`w-full p-4 text-left border rounded-lg transition-colors text-gray-800 ${answers[currentQuestion.id] === option.id
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-border hover:border-border bg-background'
                                    }`}
                            >
                                {lang === 'en' ? option.text : option.textAr}
                            </button>
                        ))}
                    </div>
                )}

                {/* True/False Options */}
                {currentQuestion.type === 'true-false' && (
                    <div className="space-y-3">
                        <button
                            onClick={() => handleAnswer('true')}
                            className={`w-full p-4 text-left border rounded-lg transition-colors ${answers[currentQuestion.id] === 'true'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-border hover:border-border'
                                }`}
                        >
                            {lang === 'en' ? 'True' : 'صحيح'}
                        </button>
                        <button
                            onClick={() => handleAnswer('false')}
                            className={`w-full p-4 text-left border rounded-lg transition-colors ${answers[currentQuestion.id] === 'false'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-border hover:border-border'
                                }`}
                        >
                            {lang === 'en' ? 'False' : 'خطأ'}
                        </button>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
                <Button
                    variant="outline"
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                >
                    {lang === 'en' ? 'Previous' : 'السابق'}
                </Button>

                <Button
                    onClick={nextQuestion}
                    disabled={!hasAnswered}
                    className="ml-auto"
                >
                    {isLastQuestion
                        ? (lang === 'en' ? 'Finish Quiz' : 'إنهاء الاختبار')
                        : (lang === 'en' ? 'Next' : 'التالي')
                    }
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </div>
    )
}
