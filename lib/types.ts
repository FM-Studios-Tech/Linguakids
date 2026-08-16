export interface QuizOption {
  text: string;
}

export type QuizType = 'text_multiple_choice' | 'audio_multiple_choice' | 'audio_typing';

export interface Quiz {
  type: QuizType;
  questionText?: string;
  questionAudioUrl?: string;
  correctOptionId?: string;
  correctAnswerText?: string;
  options?: Record<string, QuizOption>;
}

export interface LearningItem {
  englishLetter: string;
  englishWord: string;
  arabicWord: string;
  audioUrlLetter: string;
  audioUrlWord: string;
}

export interface LessonData {
  learningItems: Record<string, LearningItem>;
  quizzes: Record<string, Quiz>;
}

export interface Lesson {
  title: string;
  order: number;
  data: LessonData;
}

export interface Level {
  title: string;
  order: number;
  lessons: Record<string, Lesson>;
}

export interface World {
  title: string;
  order: number;
  levels: Record<string, Level>;
}

export interface AppState {
  worlds: Record<string, World>;
}
