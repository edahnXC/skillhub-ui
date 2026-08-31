export interface QuizOption {
  id: number;
  optionText: string;
}

export interface QuizQuestion {
  id: number;
  questionText: string;
  displayOrder: number;
  options: QuizOption[];
}

export interface QuestionFeedback {
  questionId: number;
  questionText: string;
  selectedOptionId: number;
  correctOptionId: number;
  isCorrect: boolean;
  explanation?: string | null;
}

export interface QuizAttemptResult {
  attemptId: number;
  quizId: number;
  scorePercentage: number;
  correctCount: number;
  totalQuestions: number;
  isPassed: boolean;
  passingScorePercentage: number;
  completedAt: string;
  questionFeedback: QuestionFeedback[];
}

export interface Quiz {
  id: number;
  courseId: number;
  sectionId?: number | null;
  title: string;
  description?: string | null;
  passingScorePercentage: number;
  totalQuestions: number;
  questions: QuizQuestion[];
  bestAttempt?: QuizAttemptResult | null;
}

export interface SubmitQuestionAnswer {
  questionId: number;
  selectedOptionId: number;
}

export interface SubmitQuizAttemptRequest {
  quizId: number;
  answers: SubmitQuestionAnswer[];
}
