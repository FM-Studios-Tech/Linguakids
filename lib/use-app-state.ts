// 'use client';

// import { useReducer, useCallback } from 'react';
// import { initialState } from './mock-data';
// import type {
//   AppState,
//   World,
//   Level,
//   Lesson,
//   LessonData,
//   LearningItem,
//   Quiz,
// } from './types';

// type Action =
//   | { type: 'ADD_WORLD'; world: World }
//   | { type: 'UPDATE_WORLD'; worldId: string; world: Partial<World> }
//   | { type: 'DELETE_WORLD'; worldId: string }
//   | { type: 'ADD_LEVEL'; worldId: string; level: Level }
//   | { type: 'UPDATE_LEVEL'; worldId: string; levelId: string; level: Partial<Level> }
//   | { type: 'DELETE_LEVEL'; worldId: string; levelId: string }
//   | { type: 'ADD_LESSON'; worldId: string; levelId: string; lesson: Lesson }
//   | {
//       type: 'UPDATE_LESSON';
//       worldId: string;
//       levelId: string;
//       lessonId: string;
//       lesson: Partial<Lesson>;
//     }
//   | { type: 'DELETE_LESSON'; worldId: string; levelId: string; lessonId: string }
//   | {
//       type: 'UPDATE_LESSON_DATA';
//       worldId: string;
//       levelId: string;
//       lessonId: string;
//       data: LessonData;
//     };

// export function generateId(prefix: string): string {
//   return `${prefix}_${Date.now().toString(36)}${Math.random()
//     .toString(36)
//     .slice(2, 6)}`;
// }

// function reducer(state: AppState, action: Action): AppState {
//   switch (action.type) {
//     case 'ADD_WORLD': {
//       const id = generateId('world');
//       return {
//         ...state,
//         worlds: { ...state.worlds, [id]: action.world },
//       };
//     }
//     case 'UPDATE_WORLD': {
//       const world = state.worlds[action.worldId];
//       if (!world) return state;
//       return {
//         ...state,
//         worlds: {
//           ...state.worlds,
//           [action.worldId]: { ...world, ...action.world },
//         },
//       };
//     }
//     case 'DELETE_WORLD': {
//       const { [action.worldId]: _, ...rest } = state.worlds;
//       return { ...state, worlds: rest };
//     }
//     case 'ADD_LEVEL': {
//       const world = state.worlds[action.worldId];
//       if (!world) return state;
//       const id = generateId('level');
//       return {
//         ...state,
//         worlds: {
//           ...state.worlds,
//           [action.worldId]: {
//             ...world,
//             levels: { ...world.levels, [id]: action.level },
//           },
//         },
//       };
//     }
//     case 'UPDATE_LEVEL': {
//       const world = state.worlds[action.worldId];
//       if (!world) return state;
//       const level = world.levels[action.levelId];
//       if (!level) return state;
//       return {
//         ...state,
//         worlds: {
//           ...state.worlds,
//           [action.worldId]: {
//             ...world,
//             levels: {
//               ...world.levels,
//               [action.levelId]: { ...level, ...action.level },
//             },
//           },
//         },
//       };
//     }
//     case 'DELETE_LEVEL': {
//       const world = state.worlds[action.worldId];
//       if (!world) return state;
//       const { [action.levelId]: _, ...rest } = world.levels;
//       return {
//         ...state,
//         worlds: {
//           ...state.worlds,
//           [action.worldId]: { ...world, levels: rest },
//         },
//       };
//     }
//     case 'ADD_LESSON': {
//       const world = state.worlds[action.worldId];
//       if (!world) return state;
//       const level = world.levels[action.levelId];
//       if (!level) return state;
//       const id = generateId('lesson');
//       return {
//         ...state,
//         worlds: {
//           ...state.worlds,
//           [action.worldId]: {
//             ...world,
//             levels: {
//               ...world.levels,
//               [action.levelId]: {
//                 ...level,
//                 lessons: { ...level.lessons, [id]: action.lesson },
//               },
//             },
//           },
//         },
//       };
//     }
//     case 'UPDATE_LESSON': {
//       const world = state.worlds[action.worldId];
//       if (!world) return state;
//       const level = world.levels[action.levelId];
//       if (!level) return state;
//       const lesson = level.lessons[action.lessonId];
//       if (!lesson) return state;
//       return {
//         ...state,
//         worlds: {
//           ...state.worlds,
//           [action.worldId]: {
//             ...world,
//             levels: {
//               ...world.levels,
//               [action.levelId]: {
//                 ...level,
//                 lessons: {
//                   ...level.lessons,
//                   [action.lessonId]: { ...lesson, ...action.lesson },
//                 },
//               },
//             },
//           },
//         },
//       };
//     }
//     case 'DELETE_LESSON': {
//       const world = state.worlds[action.worldId];
//       if (!world) return state;
//       const level = world.levels[action.levelId];
//       if (!level) return state;
//       const { [action.lessonId]: _, ...rest } = level.lessons;
//       return {
//         ...state,
//         worlds: {
//           ...state.worlds,
//           [action.worldId]: {
//             ...world,
//             levels: {
//               ...world.levels,
//               [action.levelId]: { ...level, lessons: rest },
//             },
//           },
//         },
//       };
//     }
//     case 'UPDATE_LESSON_DATA': {
//       const world = state.worlds[action.worldId];
//       if (!world) return state;
//       const level = world.levels[action.levelId];
//       if (!level) return state;
//       const lesson = level.lessons[action.lessonId];
//       if (!lesson) return state;
//       return {
//         ...state,
//         worlds: {
//           ...state.worlds,
//           [action.worldId]: {
//             ...world,
//             levels: {
//               ...world.levels,
//               [action.levelId]: {
//                 ...level,
//                 lessons: {
//                   ...level.lessons,
//                   [action.lessonId]: { ...lesson, data: action.data },
//                 },
//               },
//             },
//           },
//         },
//       };
//     }
//     default:
//       return state;
//   }
// }

// export interface LearningItemUpdate {
//   itemId: string;
//   item: Partial<LearningItem>;
// }

// export interface QuizUpdate {
//   quizId: string;
//   quiz: Partial<Quiz>;
// }

// export function useAppState() {
//   const [state, dispatch] = useReducer(reducer, initialState);

//   const addWorld = useCallback((world: World) => {
//     dispatch({ type: 'ADD_WORLD', world });
//   }, []);

//   const updateWorld = useCallback((worldId: string, world: Partial<World>) => {
//     dispatch({ type: 'UPDATE_WORLD', worldId, world });
//   }, []);

//   const deleteWorld = useCallback((worldId: string) => {
//     dispatch({ type: 'DELETE_WORLD', worldId });
//   }, []);

//   const addLevel = useCallback((worldId: string, level: Level) => {
//     dispatch({ type: 'ADD_LEVEL', worldId, level });
//   }, []);

//   const updateLevel = useCallback(
//     (worldId: string, levelId: string, level: Partial<Level>) => {
//       dispatch({ type: 'UPDATE_LEVEL', worldId, levelId, level });
//     },
//     []
//   );

//   const deleteLevel = useCallback((worldId: string, levelId: string) => {
//     dispatch({ type: 'DELETE_LEVEL', worldId, levelId });
//   }, []);

//   const addLesson = useCallback(
//     (worldId: string, levelId: string, lesson: Lesson) => {
//       dispatch({ type: 'ADD_LESSON', worldId, levelId, lesson });
//     },
//     []
//   );

//   const updateLesson = useCallback(
//     (worldId: string, levelId: string, lessonId: string, lesson: Partial<Lesson>) => {
//       dispatch({ type: 'UPDATE_LESSON', worldId, levelId, lessonId, lesson });
//     },
//     []
//   );

//   const deleteLesson = useCallback(
//     (worldId: string, levelId: string, lessonId: string) => {
//       dispatch({ type: 'DELETE_LESSON', worldId, levelId, lessonId });
//     },
//     []
//   );

//   const updateLessonData = useCallback(
//     (worldId: string, levelId: string, lessonId: string, data: LessonData) => {
//       dispatch({ type: 'UPDATE_LESSON_DATA', worldId, levelId, lessonId, data });
//     },
//     []
//   );

//   return {
//     state,
//     addWorld,
//     updateWorld,
//     deleteWorld,
//     addLevel,
//     updateLevel,
//     deleteLevel,
//     addLesson,
//     updateLesson,
//     deleteLesson,
//     updateLessonData,
//   };
// }

// export type AppActions = ReturnType<typeof useAppState>;
'use client';

import { useReducer, useCallback } from 'react';
import { initialState } from './mock-data';
import type {
  AppState,
  World,
  Level,
  Lesson,
  LessonData,
  LearningGridCell,
  LearningItem,
  Quiz,
} from './types';

type Action =
  | { type: 'REPLACE_STATE'; payload: any }
  | { type: 'ADD_WORLD'; world: World }
  | { type: 'UPDATE_WORLD'; worldId: string; world: Partial<World> }
  | { type: 'DELETE_WORLD'; worldId: string }
  | { type: 'ADD_LEVEL'; worldId: string; level: Level }
  | { type: 'UPDATE_LEVEL'; worldId: string; levelId: string; level: Partial<Level> }
  | { type: 'DELETE_LEVEL'; worldId: string; levelId: string }
  | { type: 'ADD_LESSON'; worldId: string; levelId: string; lesson: Lesson }
  | {
      type: 'UPDATE_LESSON';
      worldId: string;
      levelId: string;
      lessonId: string;
      lesson: Partial<Lesson>;
    }
  | { type: 'DELETE_LESSON'; worldId: string; levelId: string; lessonId: string }
  | {
      type: 'UPDATE_LESSON_DATA';
      worldId: string;
      levelId: string;
      lessonId: string;
      data: LessonData;
    };

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
   case 'REPLACE_STATE': {
      const incomingWorlds = action.payload?.worlds;
      
      // If there are no worlds at all, fallback to an empty safe structure
      if (!incomingWorlds || typeof incomingWorlds !== 'object') {
        return { worlds: {} };
      }

      const sanitizedWorlds: any = {};

      // Deeply sanitize every level, lesson, learning item, and quiz
      Object.keys(incomingWorlds).forEach((wId) => {
        const world = incomingWorlds[wId] || {};
        const incomingLevels = world.levels || {};
        const sanitizedLevels: any = {};
        
        Object.keys(incomingLevels).forEach((lId) => {
          const level = incomingLevels[lId] || {};
          const incomingLessons = level.lessons || {};
          const sanitizedLessons: any = {};

          Object.keys(incomingLessons).forEach((lessonId) => {
            const lesson = incomingLessons[lessonId] || {};
            const lessonData = lesson.data || {};
            const incomingCollection = lessonData.learningItems || {};
            const isWrappedCollection =
              incomingCollection.items && typeof incomingCollection.items === 'object';
            const incomingLearningItems = isWrappedCollection
              ? incomingCollection.items
              : incomingCollection;
            const sanitizedLearningItems: Record<string, LearningItem> = {};
            const incomingGrid = lessonData.learningItemsGrid;
            const looksLikeGrid = Object.values(incomingLearningItems).some(
              (item: any) => item && ('language' in item || 'row' in item || 'column' in item)
            );
            const wasLessonLevelGrid =
              lessonData.learningItemsMode === 'grid' || Boolean(incomingGrid) || looksLikeGrid;

            const sanitizeCells = (
              rawCells: Record<string, any>
            ): Record<string, LearningGridCell> =>
              Object.fromEntries(
                Object.entries(rawCells).map(([cellId, rawCell]: [string, any]) => [
                  cellId,
                  {
                    row: Number(rawCell?.row) || 1,
                    column: Number(rawCell?.column) || 1,
                    language: (rawCell?.language === 'arabic'
                      ? 'arabic'
                      : 'english') as 'arabic' | 'english',
                    text: rawCell?.text ?? '',
                    audioUrl: rawCell?.audioUrl ?? '',
                  },
                ])
              );

            if (wasLessonLevelGrid) {
              const rawGridCells = incomingGrid?.cells || incomingLearningItems;
              sanitizedLearningItems.item_grid = { cells: sanitizeCells(rawGridCells) };
            } else {
              Object.keys(incomingLearningItems).forEach((itemId) => {
                const item = incomingLearningItems[itemId] || {};

                if (item.cells && typeof item.cells === 'object') {
                  sanitizedLearningItems[itemId] = {
                    cells: sanitizeCells(item.cells),
                  };
                  return;
                }

                // Migrate fixed ItemA/ItemB/ItemC and older flat records to
                // explicit, unlimited cells with Unity-friendly coordinates.
                sanitizedLearningItems[itemId] = {
                  cells: {
                    cell_1_1: {
                      row: 1,
                      column: 1,
                      language: 'english',
                      text: item.ItemA?.englishLetter ?? item.englishLetter ?? '',
                      audioUrl:
                        item.ItemA?.audioUrlLetter ?? item.audioUrlLetter ?? '',
                    },
                    cell_2_1: {
                      row: 2,
                      column: 1,
                      language: 'english',
                      text: item.ItemB?.englishWord ?? item.englishWord ?? '',
                      audioUrl: item.ItemB?.audioUrlWord ?? item.audioUrlWord ?? '',
                    },
                    cell_3_1: {
                      row: 3,
                      column: 1,
                      language: 'arabic',
                      text: item.ItemC?.arabicWord ?? item.arabicWord ?? '',
                      audioUrl:
                        item.ItemC?.audioUrlArabic ?? item.audioUrlArabic ?? '',
                    },
                  },
                };
              });
            }

            const incomingGridSize =
              incomingCollection.gridSize || lessonData.gridSize || incomingGrid;
            const gridSize = incomingGridSize
              ? {
                  rows: Number(incomingGridSize.rows) || 0,
                  columns: Number(incomingGridSize.columns) || 0,
                }
              : { rows: 3, columns: 1 };

            sanitizedLessons[lessonId] = {
              ...lesson,
              data: {
                learningItems: {
                  name: incomingCollection.name ?? 'عناصر التعلم',
                  description: incomingCollection.description ?? '',
                  gridSize,
                  items: sanitizedLearningItems,
                },
                // Ensure quizzes is always an object, never undefined/null
                quizzes: lessonData.quizzes || {},
              }
            };
          });

          sanitizedLevels[lId] = {
            ...level,
            lessons: sanitizedLessons
          };
        });

        sanitizedWorlds[wId] = {
          ...world,
          buttonImageUrl: world.buttonImageUrl ?? '',
          backgroundImageUrl: world.backgroundImageUrl ?? '',
          levels: sanitizedLevels
        };
      });

      return {
        ...action.payload,
        worlds: sanitizedWorlds,
      };
    }
    case 'ADD_WORLD': {
      const id = generateId('world');
      return {
        ...state,
        worlds: { ...(state.worlds || {}), [id]: action.world },
      };
    }
    case 'UPDATE_WORLD': {
      const world = state.worlds[action.worldId];
      if (!world) return state;
      return {
        ...state,
        worlds: {
          ...state.worlds,
          [action.worldId]: { ...world, ...action.world },
        },
      };
    }
    case 'DELETE_WORLD': {
      const { [action.worldId]: _, ...rest } = state.worlds;
      return { ...state, worlds: rest };
    }
    case 'ADD_LEVEL': {
      const world = state.worlds[action.worldId];
      if (!world) return state;
      const id = generateId('level');
      return {
        ...state,
        worlds: {
          ...state.worlds,
          [action.worldId]: {
            ...world,
            levels: { ...(world.levels || {}), [id]: action.level },
          },
        },
      };
    }
    case 'UPDATE_LEVEL': {
      const world = state.worlds[action.worldId];
      if (!world) return state;
      const level = world.levels[action.levelId];
      if (!level) return state;
      return {
        ...state,
        worlds: {
          ...state.worlds,
          [action.worldId]: {
            ...world,
            levels: {
              ...world.levels,
              [action.levelId]: { ...level, ...action.level },
            },
          },
        },
      };
    }
    case 'DELETE_LEVEL': {
      const world = state.worlds[action.worldId];
      if (!world) return state;
      const { [action.levelId]: _, ...rest } = world.levels;
      return {
        ...state,
        worlds: {
          ...state.worlds,
          [action.worldId]: { ...world, levels: rest },
        },
      };
    }
    case 'ADD_LESSON': {
      const world = state.worlds[action.worldId];
      if (!world) return state;
      const level = world.levels[action.levelId];
      if (!level) return state;
      const id = generateId('lesson');
      return {
        ...state,
        worlds: {
          ...state.worlds,
          [action.worldId]: {
            ...world,
            levels: {
              ...world.levels,
              [action.levelId]: {
                ...level,
                lessons: { ...(level.lessons || {}), [id]: action.lesson },
              },
            },
          },
        },
      };
    }
    case 'UPDATE_LESSON': {
      const world = state.worlds[action.worldId];
      if (!world) return state;
      const level = world.levels[action.levelId];
      if (!level) return state;
      const lesson = level.lessons[action.lessonId];
      if (!lesson) return state;
      return {
        ...state,
        worlds: {
          ...state.worlds,
          [action.worldId]: {
            ...world,
            levels: {
              ...world.levels,
              [action.levelId]: {
                ...level,
                lessons: {
                  ...level.lessons,
                  [action.lessonId]: { ...lesson, ...action.lesson },
                },
              },
            },
          },
        },
      };
    }
    case 'DELETE_LESSON': {
      const world = state.worlds[action.worldId];
      if (!world) return state;
      const level = world.levels[action.levelId];
      if (!level) return state;
      const { [action.lessonId]: _, ...rest } = level.lessons;
      return {
        ...state,
        worlds: {
          ...state.worlds,
          [action.worldId]: {
            ...world,
            levels: {
              ...world.levels,
              [action.levelId]: { ...level, lessons: rest },
            },
          },
        },
      };
    }
    case 'UPDATE_LESSON_DATA': {
      const world = state.worlds[action.worldId];
      if (!world) return state;
      const level = world.levels[action.levelId];
      if (!level) return state;
      const lesson = level.lessons[action.lessonId];
      if (!lesson) return state;
      return {
        ...state,
        worlds: {
          ...state.worlds,
          [action.worldId]: {
            ...world,
            levels: {
              ...world.levels,
              [action.levelId]: {
                ...level,
                lessons: {
                  ...level.lessons,
                  [action.lessonId]: { ...lesson, data: action.data },
                },
              },
            },
          },
        },
      };
    }
    default:
      return state;
  }
}

export interface LearningItemUpdate {
  itemId: string;
  item: Partial<LearningItem>;
}

export interface QuizUpdate {
  quizId: string;
  quiz: Partial<Quiz>;
}

export function useAppState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addWorld = useCallback((world: World) => {
    dispatch({ type: 'ADD_WORLD', world });
  }, []);

  const updateWorld = useCallback((worldId: string, world: Partial<World>) => {
    dispatch({ type: 'UPDATE_WORLD', worldId, world });
  }, []);

  const deleteWorld = useCallback((worldId: string) => {
    dispatch({ type: 'DELETE_WORLD', worldId });
  }, []);

  const addLevel = useCallback((worldId: string, level: Level) => {
    dispatch({ type: 'ADD_LEVEL', worldId, level });
  }, []);

  const updateLevel = useCallback(
    (worldId: string, levelId: string, level: Partial<Level>) => {
      dispatch({ type: 'UPDATE_LEVEL', worldId, levelId, level });
    },
    []
  );

  const deleteLevel = useCallback((worldId: string, levelId: string) => {
    dispatch({ type: 'DELETE_LEVEL', worldId, levelId });
  }, []);

  const addLesson = useCallback(
    (worldId: string, levelId: string, lesson: Lesson) => {
      dispatch({ type: 'ADD_LESSON', worldId, levelId, lesson });
    },
    []
  );

  const updateLesson = useCallback(
    (worldId: string, levelId: string, lessonId: string, lesson: Partial<Lesson>) => {
      dispatch({ type: 'UPDATE_LESSON', worldId, levelId, lessonId, lesson });
    },
    []
  );

  const deleteLesson = useCallback(
    (worldId: string, levelId: string, lessonId: string) => {
      dispatch({ type: 'DELETE_LESSON', worldId, levelId, lessonId });
    },
    []
  );

  const updateLessonData = useCallback(
    (worldId: string, levelId: string, lessonId: string, data: LessonData) => {
      dispatch({ type: 'UPDATE_LESSON_DATA', worldId, levelId, lessonId, data });
    },
    []
  );

  return {
    state,
    dispatch,
    addWorld,
    updateWorld,
    deleteWorld,
    addLevel,
    updateLevel,
    deleteLevel,
    addLesson,
    updateLesson,
    deleteLesson,
    updateLessonData,
  };
}

export type AppActions = ReturnType<typeof useAppState>;
