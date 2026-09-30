import type { AppState, LearningItem } from './types';

function createMockLearningItem(
  letter: string,
  letterAudio: string,
  word: string,
  wordAudio: string,
  arabicWord: string
): LearningItem {
  return {
    cells: {
      cell_1_1: {
        row: 1,
        column: 1,
        language: 'english',
        text: letter,
        audioUrl: letterAudio,
      },
      cell_2_1: {
        row: 2,
        column: 1,
        language: 'english',
        text: word,
        audioUrl: wordAudio,
      },
      cell_3_1: {
        row: 3,
        column: 1,
        language: 'arabic',
        text: arabicWord,
        audioUrl: '',
      },
    },
  };
}

export const initialState: AppState = {
  worlds: {
    world_001: {
      title: 'World 1: Alphabet Oasis',
      order: 1,
      buttonImageUrl: '',
      backgroundImageUrl: '',
      levels: {
        level_001: {
          title: 'Level 1: First Letters',
          order: 1,
          lessons: {
            lesson_001: {
              title: 'Lesson 1: Letter A',
              order: 1,
              data: {
                learningItems: {
                  name: 'عناصر التعلم',
                  description: '',
                  gridSize: { rows: 3, columns: 1 },
                  items: {
                    item_001: createMockLearningItem(
                      'A', '/mock/a.mp3', 'Apple', '/mock/apple.mp3', 'تُفَّاح'
                    ),
                    item_002: createMockLearningItem(
                      'A', '/mock/a.mp3', 'Ant', '/mock/ant.mp3', 'نملة'
                    ),
                  },
                },
                quizzes: {
                  quiz_001: {
                    type: 'text_multiple_choice',
                    questionText: 'تُفَّاح',
                    correctOptionId: 'opt_2',
                    options: {
                      opt_1: { text: 'Orange' },
                      opt_2: { text: 'Apple' },
                      opt_3: { text: 'Banana' },
                      opt_4: { text: 'Grape' },
                    },
                  },
                  quiz_002: {
                    type: 'audio_multiple_choice',
                    questionAudioUrl: '/mock/ant.mp3',
                    correctOptionId: 'opt_1',
                    options: {
                      opt_1: { text: 'Ant' },
                      opt_2: { text: 'Elephant' },
                      opt_3: { text: 'Apple' },
                    },
                  },
                  quiz_003: {
                    type: 'audio_typing',
                    questionAudioUrl: '/mock/apple.mp3',
                    correctAnswerText: 'Apple',
                  },
                },
              },
            },
            lesson_002: {
              title: 'Lesson 2: Letter B',
              order: 2,
              data: {
                learningItems: {
                  name: 'عناصر التعلم',
                  description: '',
                  gridSize: { rows: 3, columns: 1 },
                  items: {
                    item_001: createMockLearningItem(
                      'B', '/mock/b.mp3', 'Ball', '/mock/ball.mp3', 'كُرَة'
                    ),
                  },
                },
                quizzes: {
                  quiz_001: {
                    type: 'text_multiple_choice',
                    questionText: 'كُرَة',
                    correctOptionId: 'opt_1',
                    options: {
                      opt_1: { text: 'Ball' },
                      opt_2: { text: 'Bat' },
                      opt_3: { text: 'Book' },
                    },
                  },
                },
              },
            },
          },
        },
        level_002: {
          title: 'Level 2: More Letters',
          order: 2,
          lessons: {
            lesson_001: {
              title: 'Lesson 1: Letter C',
              order: 1,
              data: {
                learningItems: {
                  name: 'عناصر التعلم',
                  description: '',
                  gridSize: { rows: 3, columns: 1 },
                  items: {
                    item_001: createMockLearningItem(
                      'C', '/mock/c.mp3', 'Cat', '/mock/cat.mp3', 'قِطّ'
                    ),
                  },
                },
                quizzes: {
                  quiz_001: {
                    type: 'audio_multiple_choice',
                    questionAudioUrl: '/mock/cat.mp3',
                    correctOptionId: 'opt_2',
                    options: {
                      opt_1: { text: 'Car' },
                      opt_2: { text: 'Cat' },
                      opt_3: { text: 'Cup' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    world_002: {
      title: 'World 2: Number Safari',
      order: 2,
      buttonImageUrl: '',
      backgroundImageUrl: '',
      levels: {
        level_001: {
          title: 'Level 1: Counting 1-5',
          order: 1,
          lessons: {
            lesson_001: {
              title: 'Lesson 1: Numbers 1 & 2',
              order: 1,
              data: {
                learningItems: {
                  name: 'عناصر التعلم',
                  description: '',
                  gridSize: { rows: 3, columns: 1 },
                  items: {
                    item_001: createMockLearningItem(
                      '1', '/mock/1.mp3', 'One', '/mock/one.mp3', 'واحِد'
                    ),
                    item_002: createMockLearningItem(
                      '2', '/mock/2.mp3', 'Two', '/mock/two.mp3', 'اِثنان'
                    ),
                  },
                },
                quizzes: {
                  quiz_001: {
                    type: 'text_multiple_choice',
                    questionText: 'واحِد',
                    correctOptionId: 'opt_1',
                    options: {
                      opt_1: { text: 'One' },
                      opt_2: { text: 'Two' },
                      opt_3: { text: 'Three' },
                    },
                  },
                  quiz_002: {
                    type: 'audio_typing',
                    questionAudioUrl: '/mock/two.mp3',
                    correctAnswerText: 'Two',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
