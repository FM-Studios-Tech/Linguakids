export interface QuizOption {
  text: string;
}

export type QuizType = 'text_multiple_choice' | 'audio_multiple_choice' | 'audio_typing' | 'arabic_voice_record';

export interface Quiz {
  type: QuizType;
  order?: number;
  questionText?: string;
  questionAudioUrl?: string;
  correctOptionId?: string;
  correctAnswerText?: string;
  options?: Record<string, QuizOption>;
  arabicPromptText?: string;
  englishPromptText?: string;
}

export interface LearningItem {
  cells: Record<string, LearningGridCell>;
}

export type LearningCellLanguage = 'english' | 'arabic';

export interface LearningGridCell {
  row: number;
  column: number;
  language: LearningCellLanguage;
  text: string;
  audioUrl: string;
}

export interface GridSize {
  rows: number;
  columns: number;
}

export interface LearningItemsCollection {
  name: string;
  description: string;
  gridSize: GridSize;
  items: Record<string, LearningItem>;
}

export interface LessonData {
  learningItems: LearningItemsCollection;
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
  buttonImageUrl: string;
  backgroundImageUrl: string;
  levels: Record<string, Level>;
}

export interface AppState {
  worlds: Record<string, World>;
}
