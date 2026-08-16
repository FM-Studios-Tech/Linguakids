import type { AppState } from './types';

export const initialState: AppState = {
  worlds: {
    world_001: {
      title: 'World 1: Alphabet Oasis',
      order: 1,
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
                  item_001: {
                    englishLetter: 'A',
                    englishWord: 'Apple',
                    arabicWord: 'تُفَّاح',
                    audioUrlLetter: '/mock/a.mp3',
                    audioUrlWord: '/mock/apple.mp3',
                  },
                  item_002: {
                    englishLetter: 'A',
                    englishWord: 'Ant',
                    arabicWord: 'نملة',
                    audioUrlLetter: '/mock/a.mp3',
                    audioUrlWord: '/mock/ant.mp3',
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
                  item_001: {
                    englishLetter: 'B',
                    englishWord: 'Ball',
                    arabicWord: 'كُرَة',
                    audioUrlLetter: '/mock/b.mp3',
                    audioUrlWord: '/mock/ball.mp3',
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
                  item_001: {
                    englishLetter: 'C',
                    englishWord: 'Cat',
                    arabicWord: 'قِطّ',
                    audioUrlLetter: '/mock/c.mp3',
                    audioUrlWord: '/mock/cat.mp3',
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
                  item_001: {
                    englishLetter: '1',
                    englishWord: 'One',
                    arabicWord: 'واحِد',
                    audioUrlLetter: '/mock/1.mp3',
                    audioUrlWord: '/mock/one.mp3',
                  },
                  item_002: {
                    englishLetter: '2',
                    englishWord: 'Two',
                    arabicWord: 'اِثنان',
                    audioUrlLetter: '/mock/2.mp3',
                    audioUrlWord: '/mock/two.mp3',
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
